import BlogPost from '../models/BlogPost.js';

// GET /api/blog/posts
// Query params: status, category, tag, lang, page, limit
export const listPosts = async (req, res, next) => {
  try {
    const { status = 'published', category, tag, lang = 'en', page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { status };
    if (category) filter.categories = category;

    let posts = await BlogPost.find(filter)
      .populate('author', 'name slug avatar')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Filter by tag (stored inside content.<lang>.tags array)
    if (tag) {
      const tagLower = tag.toLowerCase().replace(/-/g, ' ');
      posts = posts.filter((p) => {
        const tags = p.content?.[lang]?.tags || p.content?.en?.tags || [];
        return tags.some((t) => t.toLowerCase() === tagLower);
      });
    }

    const total = await BlogPost.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/blog/posts/:slug
export const getPostBySlug = async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug }).populate('author', 'name slug avatar bio');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found.' });
    }

    // Increment view count (fire and forget)
    BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

// POST /api/blog/posts  (author+)
export const createPost = async (req, res, next) => {
  try {
    const { slug, status, categories, featuredImage, publishedAt, readTime, content } = req.body;

    if (!slug || !content?.en?.title) {
      return res.status(400).json({ success: false, error: 'slug and content.en.title are required.' });
    }

    const post = await BlogPost.create({
      slug,
      status: status || 'draft',
      author: req.user._id,
      categories: categories || [],
      featuredImage: featuredImage || {},
      publishedAt: status === 'published' ? (publishedAt || new Date()) : null,
      readTime: readTime || '',
      content,
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'A post with this slug already exists.' });
    }
    next(err);
  }
};

// PUT /api/blog/posts/:id  (author+)
export const updatePost = async (req, res, next) => {
  try {
    const { slug, status, categories, featuredImage, publishedAt, readTime, content } = req.body;

    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });

    // Only admin can change another author's post
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this post.' });
    }

    if (slug) post.slug = slug;
    if (status) {
      if (status === 'published' && post.status !== 'published') {
        post.publishedAt = publishedAt || new Date();
      }
      post.status = status;
    }
    if (categories) post.categories = categories;
    if (featuredImage) post.featuredImage = featuredImage;
    if (readTime) post.readTime = readTime;
    if (content) post.content = { ...post.content, ...content };

    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'A post with this slug already exists.' });
    }
    next(err);
  }
};

// DELETE /api/blog/posts/:id  (admin only)
export const deletePost = async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
};

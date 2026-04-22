import mongoose from 'mongoose';

const langContentSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    body: { type: String, default: '' },
    tags: { type: [String], default: [] },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      focusKeyword: { type: String, default: '' },
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String, default: '' },
    comment: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' },
  },
  { timestamps: true }
);

const blogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived'],
      default: 'draft',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categories: { type: [String], default: [] },
    featuredImage: {
      url: { type: String, default: '' },
      altText: { type: String, default: '' },
    },
    publishedAt:  { type: Date, default: null }, // when the post actually went live (set by system)
    scheduledAt:  { type: Date, default: null }, // when the editor intends the post to go live
    views: { type: Number, default: 0 },
    readTime: { type: String, default: '' },
    content: {
      en: { type: langContentSchema, default: () => ({}) },
      ar: { type: langContentSchema, default: () => ({}) },
      fr: { type: langContentSchema, default: () => ({}) },
      es: { type: langContentSchema, default: () => ({}) },
      de: { type: langContentSchema, default: () => ({}) },
      pt: { type: langContentSchema, default: () => ({}) },
    },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

// Indexes for fast filtered queries (slug index is implicit from unique:true above)
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ status: 1, scheduledAt: 1 }); // for the cron job query
blogPostSchema.index({ categories: 1 });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;

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

const blogPostSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categories: { type: [String], default: [] },
    featuredImage: {
      url: { type: String, default: '' },
      altText: { type: String, default: '' },
    },
    publishedAt: { type: Date, default: null },
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
  },
  { timestamps: true }
);

// Index for fast slug lookup and filtered queries
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ categories: 1 });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;

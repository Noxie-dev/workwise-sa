# Blog Wise Content

Blog Wise content is managed in `client/src/data/blogWiseContent.ts`.

## Add A New Article

Add a post object to one of these exports:

- `heroBlogs`: featured carousel articles at the top of the page.
- `popularPosts`: flip cards in the Popular Now section. These should include `backContent`.
- `latestPosts`: searchable and filterable latest articles.

Use a unique numeric `id`, ISO date format (`YYYY-MM-DD`), a public image URL or local image path, and a category string. Categories are generated automatically from the content, so adding a new category to any post makes it appear in the filter bar.

## Popular Post Back Content

Popular posts use the flip-card back face. Add this field:

```ts
backContent: {
  summary: 'Short article summary shown on hover or tap.',
  tags: ['CV', 'Career', 'Tips'],
}
```

const fs = require('fs');
const path = require('path');

const blogDir = 'src/wwwroot/assets/data/blogs';
const outputFile = 'src/wwwroot/assets/data/json/blog-index.json';

const posts = [];

fs.mkdirSync(path.dirname(outputFile), { recursive: true });

if (fs.existsSync(blogDir)) {
  fs.readdirSync(blogDir).forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        const markdownContent = frontMatterMatch[2] || '';
        const post = {};

        frontMatter.split('\n').forEach(line => {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            const [, key, value] = match;

            if (value.trim().startsWith('[')) {
              try {
                post[key] = JSON.parse(value.replace(/'/g, '\"'));
              } catch {
                post[key] = [];
              }
            }
            else if (value.trim() === 'true' || value.trim() === 'false') {
              post[key] = value.trim() === 'true';
            }
            else if (!isNaN(value.trim())) {
              post[key] = parseInt(value.trim());
            }
            else {
              post[key] = value.replace(/^[\x22']|[\x22']$/g, '').trim();
            }
          }
        });

        post.filename = file.replace('.md', '');

        // Calculate timeToRead (equivalent to C# Indexer: wordCount / 200)
        const wordCount = (markdownContent.match(/[\w-]+/g) || []).length;
        post.timeToRead = Math.ceil(wordCount / 200);
        if (post.draft === true) return;
        posts.push(post);
      }
    }
  });
}

fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log('✅ Generated blog index with ' + posts.length + ' posts');

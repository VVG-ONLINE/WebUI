# css rules list

## _theme.scss

1. `.bg-accent`
2. `.text-accent`
3. `body`
4. `*`
5. `header`
6. `main`
7. `.system-panel`
8. `.system-panel a`
9. `.system-panel .status-right`
10. `.btn btn-outline-secondary`
11. `.hero-title`
12. `.hero`
13. `.workflow-container`
14. `.workflow-node`
15. `footer`
16. `.terminal-card`
17. `.terminal-card-title`
18. `.terminal-card ul li::before`
19. `.blinking-cursor`
20. `.blinking-cursor::after`
21. `@media (max-width: 768px)`
22. `.no-border-radius`
23. `.btn`
24. `a, input, textarea, select, button, .badge`
25. `a`

## _animations.scss

1. `textFlicker`
2. `glitch`
3. `blinker`
4. `blink-caret`
5. `borderAnimateLR`

## _blog.scss

1. `.blog-post`
2. `.blog-title`
3. `.blog-content`
4. `.blog-author`
5. `.blog-date`
6. `.blog-tags`
7. `.blog-comment`
8. `.blog-comment-form`
9. `.blog-comment-input`
10. `.blog-comment-submit`

## _canvas.scss

1. `.canvas-container`
2. `.canvas-canvas`
3. `.canvas-controls`
4. `.canvas-control-button`
5. `.canvas-draw-mode`
6. `.canvas-erase-mode`
7. `.canvas-clear-button`

## _components.scss

1. `.component-card`
2. `.component-header`
3. `.component-body`
4. `.component-footer`
5. `.component-button`
6. `.component-input`
7. `.component-select`
8. `.component-textarea`

## _glassmorphism.scss

1. `:root` (glass custom properties: `--glass-bg`, `--glass-bg-hover`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--glass-saturate`)
2. `[data-theme="dark"]` (dark glass custom properties)
3. `.glass-off, .glass-off *` (backdrop-filter escape hatch)
4. `.glass-off .system-panel`
5. `.glass-off .card`
6. `.glass-off .terminal-card`
7. `.glass-off .sidebar-card`
8. `.glass-off .vvg-pricing .vvg-card`
9. `.glass-off .hero-terminal`
10. `.glass-off .accordion-item`
11. `.glass-off .workflow-node`
12. `.glass-off .blog-card`
13. `.glass-off .blog-hero`
14. `.glass-off .blog-cta`
15. `.glass-off .btn-outline-secondary`
16. `.glass-off .tag-segment, .tag-user, .tag-path, .terminal-tag-group, .btn.btn-outline-secondary, .ratio-16x9, .form-control`
17. `.system-panel, .card, .terminal-card, .sidebar-card, .vvg-pricing .vvg-card, .hero-terminal, .accordion-item, .workflow-node, .btn.btn-outline-secondary, .ratio-16x9` (common glass styles)
18. `.form-control` (glass + theme-aware text/placeholder)
19. `[data-theme="dark"] .form-control`
20. `[data-theme="dark"] .form-control::placeholder`
21. `[data-theme="light"] .form-control, :root:not([data-theme]) .form-control`
22. `[data-theme="light"] .form-control::placeholder, :root:not([data-theme]) .form-control::placeholder`
23. `.card:hover, .terminal-card:hover, .sidebar-card:hover, .vvg-pricing .vvg-card:hover, .hero-terminal:hover, .accordion-item:hover, .workflow-node:hover` (hover fill)
24. `.system-panel`
25. `[data-theme="light"] .system-panel, :root:not([data-theme]) .system-panel`
26. `[data-theme="light"] .system-panel a span, :root:not([data-theme]) .system-panel a span`
27. `[data-theme="light"] .system-panel .bi, :root:not([data-theme]) .system-panel .bi`
28. `[data-theme="light"] .system-panel a:hover, :root:not([data-theme]) .system-panel a:hover`
29. `[data-theme="light"] .system-panel a:hover .bi, :root:not([data-theme]) .system-panel a:hover .bi`
30. `.hero-terminal`
31. `[data-theme="light"] .hero-terminal-input::placeholder, :root:not([data-theme]) .hero-terminal-input::placeholder`
32. `.accordion-button`
33. `.accordion-button:hover`
34. `.accordion-button:not(.collapsed)`
35. `.accordion-body`
36. `.accordion-body a`
37. `.accordion-body a:hover`
38. `.workflow-node`
39. `.workflow-node:hover`
40. `.blog-card`
41. `.blog-card:hover`
42. `.blog-hero`
43. `.blog-cta`
44. `.btn-outline-secondary`
45. `.btn-outline-secondary:hover`
46. `.tag-segment`
47. `.tag-user`
48. `.tag-path`
49. `.tag-user:hover`
50. `.tag-path:hover`

## _layout.scss

1. `.layout-container`
2. `.layout-header`
3. `.layout-main`
4. `.layout-sidebar`
5. `.layout-footer`
6. `.layout-navbar`
7. `.layout-breadcrumb`
8. `.layout-pagination`

## _main.scss

1. `body`
2. `header`
3. `nav`
4. `main`
5. `footer`
6. `.container`
7. `.row`
8. `.col`
9. `.card`
10. `.card-header`
11. `.card-body`
12. `.card-footer`

## _preloader.scss

1. `.preloader-container`
2. `.preloader-spinner`
3. `.preloader-text`

## _terminal-like-services-page.scss

1. `.terminal-like-page`
2. `.terminal-like-header`
3. `.terminal-like-content`
4. `.terminal-like-input`
5. `.terminal-like-output`

## _typography.scss

1. `.text-primary`
2. `.text-secondary`
3. `.text-success`
4. `.text-danger`
5. `.text-warning`
6. `.text-info`
7. `.text-light`
8. `.text-dark`
9. `.font-bold`
10. `.font-italic`

## _utilities.scss

1. `.d-none`
2. `.d-block`
3. `.d-inline`
4. `.d-flex`
5. `.w-100`
6. `.h-100`
7. `.m-0`
8. `.p-0`
9. `.bg-white`
10. `.bg-black`

## _variables.scss

1. `$primary-color`
2. `$secondary-color`
3. `$accent-color`
4. `$font-size-base`
5. `$line-height-base`
6. `$border-radius-base`

## app.css

1. `body`
2. `header`
3. `nav`
4. `main`
5. `footer`
6. `.container`
7. `.row`
8. `.col`
9. `.card`
10. `.card-header`
11. `.card-body`
12. `.card-footer`

## app.scss

1. `body`
2. `header`
3. `nav`
4. `main`
5. `footer`
6. `.container`
7. `.row`
8. `.col`
9. `.card`
10. `.card-header`
11. `.card-body`
12. `.card-footer`
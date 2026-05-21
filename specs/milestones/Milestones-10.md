# Milestones-10: AI Chatbot Integration for VVG Online

## Project Tasks Overview

Implementation of an AI-powered chatbot ("Vikas Model") for vvgonline.net using Blazor WASM and local LLM (qwen2.5:0.5b) to enhance visitor engagement and lead generation.

## Core Objectives

- Deploy browser-based AI assistant for visitor interaction
- Gather requirements and showcase VVG Online services
- Integrate WhatsApp handoff (+91 9893261959) for lead conversion
- Maintain privacy with client-side AI processing

---

## Phase 1: Foundation & Architecture Setup 🏗️

### Milestone 10.1: JavaScript Bridge Infrastructure

**Priority:** Critical | **Duration:** 2-3 days

#### Tasks

- [x] Create `wwwroot/assets/js/vvg-bridge.js` file structure
- [x] Import WebLLM library from CDN (`https://esm.run/@mlc-ai/web-llm`) NOTE: THIS NOT WORKING. Webgpu is not a full proof method. Many browsers are not supporting it yet.
- [x] Download the `qwen2.5:0.5b` model and configure model settings
- [x] Implement DotNetObjectReference pattern for C#-JS communication
- [x] Define `initializeVikasModel()` and `getVikasResponse()` JS functions
- [x] Set up async handling for model loading and inference
- [x] Implement progress reporting via callbacks
- [x] Set up Chat using Blazor UI div id `terminal-body` in `MainLayout.razor`
- [x] Test basic JS Interop connectivity
- [x] Check model loading in supported browsers

**Deliverables:**

- Functional JavaScript bridge file
- Verified bidirectional communication between Blazor and JS

**Technical Notes:**

```javascript
const modelId = "qwen2.5:0.5b";
// Model size: ~300-500MB quantized
// Requires: WebGPU-compatible browser (Chrome/Edge/Safari/Vivaldi)
```

---

### Milestone 10.2: Model Initialization Engine

**Priority:** Critical | **Duration:** 3-4 days

#### Tasks

- [ ] Implement `initializeVikasModel()` function with eager loading
- [ ] Create progress callback mechanism (0-100% reporting)
- [ ] Handle model download and caching strategy
- [ ] Implement error handling for unsupported browsers
- [ ] Add fallback mechanisms for loading failures

**Deliverables:**

- Background model loading functionality
- Progress tracking system
- Error handling protocols

**Success Criteria:**

- Model loads in background without blocking UI
- Progress updates sent to Blazor every 5%
- First-time load: 30-60 seconds (varies by connection)
- Subsequent loads: <5 seconds (cached)

---

### Milestone 10.3: Inference Logic Implementation

**Priority:** Critical | **Duration:** 2 days

#### Tasks

- [ ] Create `getVikasResponse()` async function
- [ ] Implement chat history management
- [ ] Configure streaming vs. complete response handling
- [ ] Test response generation with sample prompts
- [ ] Optimize token generation speed

**Deliverables:**

- Working AI response generation
- Message history persistence
- Performance benchmarks

---

## Phase 2: Blazor UI & State Management ⚙️

### Milestone 10.4: Component Architecture

**Priority:** High | **Duration:** 3-4 days

#### Tasks

- [ ] Define `ChatState` enum (Loading, Active, Chatting, HandOff)
- [ ] Implement component lifecycle methods
- [ ] Set up reactive state management with `StateHasChanged()`
- [ ] Create message data models (`ChatMessage` class)
- [ ] Make sure `src/wwwroot/assets/data/blogs`

**Deliverables:**

- Blazor component structure
- State machine implementation
- Data models

**Component States:**
```csharp
public enum ChatState
{
    Loading,    // Model downloading (0-99%)
    Active,     // Model ready, auto-open triggered
    Chatting,   // Active conversation
    HandOff     // Summary generated, WhatsApp CTA shown
}
```

---

### Milestone 10.5: Auto-Open & Loading Experience

**Priority:** High | **Duration:** 2-3 days

#### Tasks

- [ ] Implement `OnAfterRenderAsync` eager load trigger
- [ ] Create `[JSInvokable] UpdateProgress()` method
- [ ] Build loading tooltip UI with percentage display
- [ ] Implement auto-open logic at 100% progress
- [ ] Add initial greeting message

**Deliverables:**

- Seamless loading experience
- Auto-open chat window
- Welcome message system

**User Experience Flow:**

1. Page loads → Model starts downloading silently
2. Tooltip shows: "Architecting AI... X%"
3. At 100% → Chat window auto-opens
4. Greeting: "Welcome to VVG Online! I'm here to help you architect your digital growth. What's the biggest digital ambition you're working on right now?"

---

### Milestone 10.6: Chat Interface Development

**Priority:** High | **Duration:** 3-4 days

#### Tasks

- [ ] Build message list display with scroll
- [ ] Create input field with Enter key handling
- [ ] Implement user/bot message differentiation
- [ ] Add typing indicators (optional)
- [ ] Create toggle open/close functionality

**Deliverables:**

- Functional chat interface
- Message handling system
- User interaction flow

---

## Phase 3: AI Logic & Business Intelligence 🧠

### Milestone 10.7: System Prompt Engineering

**Priority:** Critical | **Duration:** 4-5 days

#### Tasks

- [ ] Define Vikas Model persona and identity in .md format at `src/wwwroot/assets/data/dataset/prompts/`
- [ ] Craft system prompt emphasizing VVG Online's expertise
- [ ] Highlight key services and value propositions
- [ ] Create knowledge base covering [6 service categories and Sub-categories](../../src/wwwroot/assets/data/services.json):
  - Strategy & Innovation
  - Digital Transformation
  - Capability Building
  - Strategic Digital Marketing
  - Design Thinking Workshops
  - IT Management Solutions
- [ ] Implement few-shot examples for each service
- [ ] create .md files for each service category in `src/wwwroot/assets/data/blogs/` in blog format. for [reference](../../src/wwwroot/assets/data/blogs/Communication-Mastery-for-Digital-Business-Success.md)
- [ ] create .csv files for knowledge base in `src/wwwroot/assets/data/dataset/knowledge/` for digital business consulting services with facts and figures.
- [ ] create .txt files for few-shot examples in `src/wwwroot/assets/data/dataset/docs/` for digital business consulting services with Q&A format. Atleast 100 examples.
- [ ] create .json file for system prompt in `src/wwwroot/assets/data/dataset/services/` for digital business consulting services with structure. for [reference](../../src/wwwroot/assets/data/dataset/services/web-development.json)
- [ ] Build conversation constraints and guardrails
- [ ] Develop response constraints (visionary tone, consultative style)
- [ ] Set constraints for visionary, consultative tone, and use-case-specific language
- [ ] Create goal/problem detection prompts
- [ ] Create clarification prompts
- [ ] Build "polite redirect" guardrails for off-topic queries
- [ ] Create goal extraction templates (Leads/Conversion/Revenue)
- [ ] Test prompt effectiveness with sample conversations
- [ ] Iterate based on test results
- [ ] Finalize system prompt JSON structure
- [ ]  update the `src/wwwroot/assets/js/chat.js` to load the system prompt from the .md, .txt, .csv, or .json files in `src/wwwroot/assets/data/dataset/` and `src/wwwroot/assets/data/blogs/` during model initialization.

**Deliverables:**

- Complete system prompt JSON
- Few-shot example library
- Guardrail mechanisms

**System Prompt Structure:**
```json
{
  "identity": {
    "name": "Vikas Model",
    "role": "VVG Online's Digital Strategy Assistant",
    "opening_line": "Welcome to VVG Online! I'm here to help you architect your digital growth."
  },
  "knowledge_base": {
    "company": "VVG Online (vvgonline.net)",
    "tagline": "End-to-End Digital Solutions",
    "specialties": [
      "Strategy & Innovation",
      "Digital Transformation",
      "Strategic Digital Marketing"
    ]
  },
  "constraints": [
    "Always ask follow-up questions",
    "Identify Goal and Problem before handoff",
    "Use visionary language"
  ]
}
```

---

### Milestone 10.8: Goal & Problem Detection

**Priority:** Critical | **Duration:** 3-4 days

#### Tasks

- [ ] Implement tag detection system (`[SUMMARY]Goal|Problem[/SUMMARY]`)
- [ ] Create parsing logic in C# for extracted data
- [ ] Build goal categorization (Leads/Conversion/Revenue)
- [ ] Implement visionary summary generation
- [ ] Test extraction accuracy with sample conversations

**Deliverables:**

- Tag detection parser
- Goal/Problem extraction engine
- Visionary response templates

**Visionary Summary Template:**
"It looks like you're aiming for [Goal], but [Problem] is standing in the way of your digital ambition. Let's get Vikas involved!"

---

### Milestone 10.9: Conversation Flow Management

**Priority:** High | **Duration:** 2-3 days

#### Tasks

- [ ] Implement multi-turn conversation handling
- [ ] Create context retention logic
- [ ] Build clarification question triggers
- [ ] Add conversation completion detection
- [ ] Test edge cases (unclear goals, multiple problems)

**Deliverables:**

- Natural conversation flow
- Context management system
- Edge case handlers

---

## Phase 4: WhatsApp Integration 📲

### Milestone 10.10: Link Generation Engine

**Priority:** High | **Duration:** 2 days

#### Tasks

- [ ] Create `PrepareWhatsAppLink()` method
- [ ] Implement URI escaping for special characters
- [ ] Format message with bold markup (`*text*`)
- [ ] Add VVG branding to auto-message
- [ ] Test link on multiple devices

**Deliverables:**
- WhatsApp link generator
- Formatted message template
- Cross-device compatibility

**Link Format:**
```
https://wa.me/919893261959?text=
*VVG Online Strategic Inquiry*%0A%0A
*Goal:* {extracted_goal}%0A
*Challenge:* {extracted_problem}%0A%0A
Let's architect a solution!
```

---

### Milestone 10.11: Handoff UI Component

**Priority:** High | **Duration:** 2-3 days

#### Tasks

- [ ] Create visionary summary card design
- [ ] Build editable Goal/Problem fields
- [ ] Design WhatsApp CTA button (official green #25D366)
- [ ] Implement handoff state transition
- [ ] Add confirmation/success messaging

**Deliverables:**

- Professional handoff interface
- Branded WhatsApp button
- Smooth transition UX

---

### Milestone 10.12: Email Backup System (Optional)

**Priority:** Medium | **Duration:** 2-3 days

#### Tasks

- [ ] Create backend API endpoint (if upgrading from GitHub Pages)
- [ ] Implement email service (SendGrid/MailKit)
- [ ] Build transcript formatting
- [ ] Add email trigger alongside WhatsApp
- [ ] Test email delivery reliability

**Deliverables:**

- Email backup functionality
- Transcript formatting
- Dual-channel lead capture

---

## Phase 5: UI/UX Polish & Styling 🎨

### Milestone 10.13: Floating Bubble Design

**Priority:** High | **Duration:** 2 days

#### Tasks

- [ ] Create floating bubble CSS with VVG brand colors
- [ ] Implement pulse effect for "ready" state
- [ ] Add hover animations
- [ ] Ensure mobile responsiveness
- [ ] Create smooth open/close transitions

**Deliverables:**

- Professional floating bubble
- Brand-consistent styling
- Responsive design

**CSS Specifications:**
```css
.chat-bubble {
  width: 60px;
  height: 60px;
  background: #007bff; /* VVG brand blue */
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}
```

---

### Milestone 10.14: Chat Window Styling

**Priority:** High | **Duration:** 3 days

#### Tasks

- [ ] Design chat window layout (350x500px)
- [ ] Create message bubble styles (user vs. bot)
- [ ] Implement scrolling behavior
- [ ] Add header with close button
- [ ] Style input field and send button

**Deliverables:**

- Professional chat interface
- Clear message differentiation
- Intuitive controls

---

### Milestone 10.15: Loading & Tooltip Refinement

**Priority:** Medium | **Duration:** 1-2 days

#### Tasks

- [ ] Design loading tooltip with percentage
- [ ] Create "Ready!" tooltip variant
- [ ] Add fade-in animations
- [ ] Position tooltip correctly above bubble
- [ ] Test across browsers

**Deliverables:**

- Polished loading experience
- Clear status indicators
- Cross-browser compatibility

---

## Milestone 10.16: Visionary Card Design

**Priority:** High | **Duration:** 2 days

#### Tasks

- [ ] Design summary card layout
- [ ] Style editable fields
- [ ] Create premium WhatsApp button
- [ ] Add success/confirmation states
- [ ] Implement card animations

**Deliverables:**

- Premium handoff interface
- Professional CTA design
- Smooth transitions

---

## Phase 6: Testing & Optimization 🧪

### Milestone 10.17: Functional Testing

**Priority:** Critical | **Duration:** 3-4 days

#### Tasks

- [ ] Test model loading across connection speeds
- [ ] Verify conversation flow with 20+ test scenarios
- [ ] Test goal/problem extraction accuracy
- [ ] Validate WhatsApp link generation
- [ ] Test state transitions
- [ ] Check error handling

**Deliverables:**

- Test case documentation
- Bug reports and fixes
- Quality assurance sign-off

**Test Scenarios:**

1. First-time visitor with fast internet
2. Returning visitor (cached model)
3. Slow connection (timeout handling)
4. Unsupported browser (fallback)
5. Off-topic queries (redirect)
6. Vague goals (clarification)
7. Multiple problems (prioritization)
8. Early exit (no WhatsApp click)

---

### Milestone 10.18: Performance Optimization

**Priority:** High | **Duration:** 2-3 days

#### Tasks

- [ ] Optimize model loading strategy
- [ ] Reduce initial bundle size
- [ ] Implement lazy loading for non-critical components
- [ ] Optimize JavaScript execution
- [ ] Test on low-end devices

**Deliverables:**

- Performance benchmarks
- Optimization report
- Improved load times

**Target Metrics:**

- Initial page load: <3 seconds
- Model ready (first visit): <60 seconds
- Model ready (cached): <5 seconds
- Response generation: <2 seconds
- Memory usage: <1GB RAM

---

### Milestone 10.19: Browser Compatibility

**Priority:** High | **Duration:** 2 days

#### Tasks:

- [ ] Test on Chrome, Edge, Safari, Firefox
- [ ] Verify WebGPU support detection
- [ ] Implement graceful degradation
- [ ] Create fallback messaging for unsupported browsers
- [ ] Test mobile browsers (iOS/Android)

**Deliverables:**

- Compatibility matrix
- Fallback mechanisms
- Browser-specific fixes

**Supported Browsers:**

- Chrome 113+ ✅
- Edge 113+ ✅
- Safari 17+ (limited) ⚠️
- Firefox (experimental WebGPU) ⚠️

---

### Milestone 10.20: Security & Privacy Audit

**Priority:** High | **Duration:** 2 days

#### Tasks

- [ ] Verify no data leaves browser (except WhatsApp handoff)
- [ ] Implement CSP headers for GitHub Pages
- [ ] Test HTTPS enforcement
- [ ] Review prompt injection vulnerabilities
- [ ] Document privacy features for users

**Deliverables:**

- Security audit report
- Privacy documentation
- Compliance checklist

---

## Phase 7: Deployment & Launch 🚀

### Milestone 10.21: GitHub Pages Configuration

**Priority:** Critical | **Duration:** 1-2 days

#### Tasks

- [ ] Configure `index.html` with correct module imports
- [ ] Set up proper MIME types for .wasm files
- [ ] Verify CORS settings
- [ ] Test production build
- [ ] Configure custom domain (vvgonline.net)

**Deliverables:**

- Production-ready deployment
- Verified live functionality
- Domain configuration

---

### Milestone 10.22: Monitoring & Analytics

**Priority:** Medium | **Duration:** 2 days

#### Tasks

- [ ] Implement basic usage tracking
- [ ] Track conversation completion rates
- [ ] Monitor WhatsApp handoff conversions
- [ ] Set up error logging
- [ ] Create analytics dashboard

**Deliverables:**

- Analytics implementation
- Monitoring dashboard
- Success metrics tracking

**Key Metrics:**

- Chat initiations per day
- Conversation completion rate
- Goal extraction accuracy
- WhatsApp click-through rate
- Conversion to actual leads

---

### Milestone 10.23: Documentation

**Priority:** High | **Duration:** 2-3 days

#### Tasks:

- [ ] Create user guide for visitors
- [ ] Document system architecture
- [ ] Write maintenance procedures
- [ ] Create troubleshooting guide
- [ ] Document future enhancement opportunities

**Deliverables:**

- Complete documentation package
- User guide
- Technical documentation

---

## Phase 8: Post-Launch Optimization 📈

### Milestone 10.24: User Feedback Collection

**Priority:** High | **Duration:** Ongoing (2 weeks)

#### Tasks

- [ ] Monitor first 100 conversations
- [ ] Collect user feedback
- [ ] Analyze conversation patterns
- [ ] Identify common pain points
- [ ] Document improvement opportunities

**Deliverables:**

- Feedback analysis report
- Improvement recommendations
- Priority enhancement list

---

### Milestone 10.25: Prompt Refinement

**Priority:** High | **Duration:** 1 week

#### Tasks:

- [ ] Analyze goal extraction accuracy
- [ ] Refine few-shot examples based on real data
- [ ] Optimize conversation length
- [ ] Improve clarification questions
- [ ] Update service descriptions

**Deliverables:**

- Updated system prompt
- Improved extraction accuracy
- Better conversation flow

---

### Milestone 10.26: Conversion Optimization

**Priority:** High | **Duration:** Ongoing

#### Tasks

- [ ] A/B test different CTAs
- [ ] Optimize handoff timing
- [ ] Refine WhatsApp message templates
- [ ] Test alternative greeting messages
- [ ] Monitor and improve conversion rates

**Deliverables:**

- Conversion rate improvements
- Optimized messaging
- A/B test results

---

## Future Enhancements 🔮

### Milestone 10.27: Advanced Features (Phase 2)

**Priority:** Low | **Duration:** TBD

#### Potential Additions:

- [ ] RAG (Retrieval-Augmented Generation) for blog content
- [ ] Semantic search across VVG Online services
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with CRM systems
- [ ] Automated follow-up sequences
- [ ] Custom AI models for specific industries

---

### Milestone 10.28: Scaling Infrastructure

**Priority:** Low | **Duration:** TBD

#### Future Considerations:

- [ ] Upgrade to VPS for backend email service
- [ ] Implement serverless functions (Azure/AWS)
- [ ] Add model versioning and updates
- [ ] Create admin dashboard for prompt management
- [ ] Implement A/B testing framework

---

## Success Criteria 🎯

### Technical Success

- [ ] Model loads successfully for 95%+ of visitors
- [ ] Response time <2 seconds average
- [ ] Zero client-side data leakage
- [ ] 99% uptime on GitHub Pages

### Business Success

- [ ] 20%+ of visitors engage with chatbot
- [ ] 15%+ conversation completion rate
- [ ] 10%+ WhatsApp handoff click-through
- [ ] 5%+ conversion to qualified leads

### User Experience Success

- [ ] Positive visitor feedback (qualitative)
- [ ] Reduced bounce rate on landing pages
- [ ] Increased time-on-site metrics
- [ ] Enhanced brand perception

---

## Risk Management ⚠️

### Technical Risks

1. **Browser Compatibility Issues**
   - Mitigation: Implement fallback messaging, test extensively

2. **Model Loading Failures**
   - Mitigation: Error handling, retry logic, user notifications

3. **Performance on Low-End Devices**
   - Mitigation: Device detection, optional mode, graceful degradation

### Business Risks

1. **Low Conversion Rates**
   - Mitigation: Continuous optimization, A/B testing, feedback loops

2. **Visitor Privacy Concerns**
   - Mitigation: Clear privacy messaging, highlight local processing

3. **Maintenance Overhead**
   - Mitigation: Comprehensive documentation, monitoring systems

---

## Resource Requirements 👥

### Development Team

- **Frontend Developer** (Blazor): 60-80 hours
- **JavaScript Developer**: 30-40 hours
- **UI/UX Designer**: 20-30 hours
- **QA Tester**: 30-40 hours
- **DevOps/Deployment**: 10-15 hours

### Tools & Services

- Blazor WebAssembly SDK
- WebLLM library
- GitHub Pages (current)
- Optional: VPS for email backup
- Analytics platform

### Timeline Estimate

- **Total Duration**: 8-10 weeks (with one developer)
- **Parallel Development**: 5-6 weeks (with team)
- **MVP Launch**: 4 weeks (core features only)

---

## Conclusion

This comprehensive roadmap provides a structured approach to implementing the Vikas Model AI chatbot for VVG Online. The phased approach allows for iterative development, testing, and optimization while maintaining focus on the core business objective: converting website visitors into qualified leads through intelligent conversation and seamless WhatsApp handoff.

**Next Steps:**

1. Review and approve this roadmap
2. Prioritize Phase 1 tasks
3. Begin JavaScript bridge development
4. Set up development environment
5. Start daily progress tracking

**Contact:**
For questions or clarifications, reach out to the VVG Online team at +91 9893261959 via WhatsApp.

---

*Document Version: 1.0*
*Created: January 20, 2026*
*Status: Draft - Pending Approval*
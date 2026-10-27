---
title: "PHP2Shell: AI-Discovered Critical Vulnerabilities Expose 70% of Websites"
slug: "php2shell-critical-vulnerabilities-october-2026"
publishedAt: "2026-10-23"
tags: ["Cybersecurity", "PHP", "Vulnerability", "CVE", "Zero-Day", "RCE", "AI Security Research"]
excerpt: "Two critical unauthenticated RCE vulnerabilities discovered by AI-assisted security research affect PHP 5.4 through 8.5. Emergency patches released October 21, 2026. Here's what every organization needs to know."
draft: false
category: "Cybersecurity"
featured: false
---

# PHP2Shell: AI-Discovered Critical Vulnerabilities Expose 70% of Websites

October 23, 2026 | *Cybersecurity*

*Two critical unauthenticated RCE vulnerabilities discovered by AI-assisted security research affect PHP 5.4 through 8.5. Emergency patches released October 21, 2026. Here's what every organization needs to know.*

On October 21, 2026, the PHP project released emergency patches for two critical remote code execution (RCE) vulnerabilities that affect an estimated 70% of websites globally. Dubbed "PHP2Shell," these flaws represent one of the most significant security incidents in recent memory—not only for their severity, but for how they were discovered: through AI-assisted security research.

The vulnerabilities were independently found by researchers at Calif (using OpenAI's GPT-5.6 Sol model) and Wiz (using Gemini 4 Argon + GPT-5.6 Sol + Wiz Atlas tool), marking a pivotal moment in automated vulnerability discovery.

## The Vulnerabilities at a Glance

| CVE | CVSS v4.0 | CVSS v3.1 | Type | Impact |
|---|---|---|---|---|
| **CVE-2026-109618** | 9.2 (Critical) | 9.8 (Critical) | Memory corruption via OOM/longjmp() | Unauthenticated RCE |
| **CVE-2026-109619** | 9.2 (Critical) | 8.1 (High) | Heap use-after-free via stale global state | Unauthenticated RCE, memory disclosure |

Both vulnerabilities allow **unauthenticated** remote code execution—meaning an attacker can take control of a vulnerable PHP server without any credentials, simply by sending crafted HTTP requests.

### CVE-2026-109618: Memory Corruption via OOM Handling

**Root cause:** PHP uses `longjmp()` to handle out-of-memory (OOM) errors and abort request processing. However, some code paths don't properly account for this scenario, leaving request memory in an uninitialized state before performing allocations.

**Exploitation:** Attackers can trigger OOM conditions to leave memory in an inconsistent state. The subsequent request cleanup procedure then reads or branches on this uninitialized memory, allowing attackers to hijack execution flow and run arbitrary code.

**Attack vector:** Exploitable via standard web requests—no special authentication or access required.

### CVE-2026-109619: Heap Use-After-Free via Stale Global State

**Root cause:** PHP maintains global state that temporarily points into request-specific memory. In certain scenarios, this global state isn't properly reset after a request completes, causing it to reference freed memory.

**Exploitation:** Subsequent requests may read or branch on this stale state before it's fully reinitialized, leading to heap use-after-free conditions. This can result in remote code execution, memory disclosure, or process crashes.

**Attack vector:** Unauthenticated, exploitable via web requests. Particularly dangerous in persistent PHP environments (PHP-FPM, mod_php) where worker processes handle multiple requests.

## Affected Versions and Scope

### Patched Versions (Released October 21, 2026)

| PHP Branch | Patched Version |
|---|---|
| PHP 8.5 | 8.5.12 |
| PHP 8.4 | 8.4.27 |
| PHP 8.3 | 8.3.36 |
| PHP 8.2 | 8.2.35 |

### Scope of Impact

**Supported versions:** All PHP 8.2, 8.3, 8.4, and 8.5 releases prior to the patched versions are vulnerable.

**Legacy versions:** Based on researcher reports, all PHP versions from **PHP 5.4 onwards** are believed to be affected. The PHP security team published minimal source backports for end-of-life versions (PHP 7.4, 8.0, 8.1) for organizations that build from source or lack LTS vendor support.

**Affected SAPIs:** Any PHP Server API (SAPI) that processes web requests is vulnerable, including:
- PHP-FPM (FastCGI Process Manager)
- Apache mod_php
- php-cgi
- FrankenPHP
- LiteSpeed
- Nginx with PHP-FPM

**What's NOT affected:** PHP CLI (command-line interface) is not vulnerable, as it doesn't process web requests.

## The Timeline: Discovery to Disclosure

- **August 1, 2026:** Calif researcher Ryan Austin discovers the first vulnerability using OpenAI GPT-5.6 Sol during an audit of PHP's source code
- **August 19, 2026:** Wiz Research independently discovers the vulnerabilities using Wiz Atlas, Gemini 4 Argon, and GPT-5.6 Sol
- **August 20-21, 2026:** Wiz confirms unauthenticated RCE against Drupal and WordPress
- **August 24, 2026:** Wiz Research reports the vulnerabilities to the PHP security team
- **September 21, 2026:** PHP acknowledges the reports and begins developing a coordinated fix
- **October 17, 2026:** Amazon Threat Intelligence identifies PHP2Shell exploitation attempts in MadPot telemetry (four days before public disclosure)
- **October 20, 2026:** PHP project announces upcoming critical security release; news leaks on Hacker News; Calif mistakenly releases proof-of-concept video
- **October 21, 2026, 13:34 UTC:** GitHub Security Advisories (GHSA) published (26 minutes before announced release time)
- **October 21, 2026, 14:00 UTC:** Emergency patches released for PHP 8.2, 8.3, 8.4, 8.5
- **October 21, 2026:** Security advisories from CERT-EU (2026-018), UK NCSC, US CISA, and others issued

Chainguard released patched versions early, allowing attackers to analyze code changes before the official release. Sansec warned that mass exploitation could begin within 15 minutes of patch availability.

## Global Response and Impact

The severity of PHP2Shell triggered an unprecedented global response:

**Government action:**
- CERT-EU issued Security Advisory 2026-018
- UK National Cyber Security Centre (NCSC) issued emergency guidance
- Australia's Australian Cyber Security Centre (ACSC) released alerts
- South Korea and Japan issued national security advisories
- Singapore Cyber Security Agency (CSA) urged organizations to patch
- U.S. CISA issued emergency alert urging immediate patching (as of October 23, 2026, vulnerabilities not yet added to Known Exploited Vulnerabilities catalog)

**Service disruptions:**
- Wikipedia temporarily took certain services offline
- Internet Archive initiated emergency patching
- Multiple government portals across Europe went offline for patching
- South Korea reported ~110,000 affected internet assets (source: AhnLab/Korea Times, October 22, 2026; ranked 6th globally in exposure)

**Industry response:**
- Major hosting providers (AWS, Google Cloud, Azure) accelerated patch deployment
- Content management systems (WordPress, Drupal, Joomla) issued security advisories
- Web application firewall vendors released emergency rule updates

**Pre-patch exploitation:**
- Amazon Threat Intelligence identified exploitation attempts dating back to October 17, 2026 (four days before public disclosure)
- Cloudflare reported signs of early exploitation prior to patch release
- News of the vulnerabilities leaked on October 20 via Hacker News and a proof-of-concept video mistakenly released by Calif
- Chainguard released patched versions early, allowing attackers to analyze code changes before official release
- Sansec warned that mass exploitation could begin within 15 minutes of patch availability

**Severity ratings:**
- PHP developers rated both vulnerabilities 9.2 (CVSS v4.0)
- Security firm watchTowr independently rated the vulnerabilities 10.0 (Critical)
- Wiz compared the impact to Heartbleed (2014) in terms of scope and severity

## What Your Organization Needs to Do

### Immediate Actions (Critical Priority)

1. **Identify all PHP instances** in your environment:
   ```bash
   php -v
   ```
   Check web servers, containers, and any applications bundling PHP.

2. **Update to patched versions immediately:**
   - PHP 8.5 → 8.5.12 or later
   - PHP 8.4 → 8.4.27 or later
   - PHP 8.3 → 8.3.36 or later
   - PHP 8.2 → 8.2.35 or later

3. **Restart all PHP services** after patching:
   ```bash
   systemctl restart php-fpm
   systemctl restart apache2  # or nginx, depending on setup
   ```

4. **Verify the patch** by checking the version again and reviewing changelogs.

### If You Can't Patch Immediately

**Isolate exposed systems:**
- Take internet-facing PHP applications offline
- Restrict access via firewalls or VPN
- Move critical services behind additional authentication layers

**Use distribution backports:**
- For PHP 7.4, 8.0, 8.1 (end-of-life), check your Linux distribution for backported security patches
- Debian, Ubuntu, RHEL, and others have released backports for their supported versions

**Deploy WAF rules (temporary mitigation only):**
- Web Application Firewalls can block some exploitation attempts
- **This is NOT a substitute for patching**—WAF rules can be bypassed

### Detection and Incident Response

**Check for signs of compromise:**
- Review web server logs for unusual request patterns
- Look for unexpected file modifications in web roots
- Monitor for new processes spawned by PHP workers
- Check for outbound connections to unknown IPs

**Assume breach if:**
- Your PHP instance was internet-facing and unpatched
- You see evidence of the OOM exploitation in logs (memory allocation failures followed by crashes)
- Unknown files appear in web-accessible directories

**Engage incident response** if you suspect compromise. These vulnerabilities allow full system takeover.

## The AI Discovery Angle: What This Means

PHP2Shell represents a watershed moment in security research. Both vulnerabilities were discovered using AI-assisted analysis:

- **Calif** used OpenAI's GPT-5.6 Sol to analyze PHP's source code and identify the OOM/longjmp() flaw
- **Wiz** used a combination of Gemini 4 Argon, GPT-5.6 Sol, and their proprietary Atlas tool to find the use-after-free vulnerability

This marks one of the first times AI systems have independently discovered critical, exploitable vulnerabilities in widely-deployed infrastructure software. The implications are significant:

**For defenders:** AI-powered vulnerability discovery can identify flaws faster than traditional manual analysis, potentially reducing the window of exposure.

**For attackers:** The same AI capabilities can be used to find vulnerabilities in other critical systems. The barrier to entry for sophisticated security research is lowering.

**For the security industry:** AI-assisted research is no longer theoretical—it's producing real, critical findings. Organizations need to adapt their vulnerability management processes accordingly.

## VVG ONLINE's Perspective

At VVG ONLINE, we've been monitoring PHP2Shell since the initial announcements. Here's what we're seeing in the field:

**Client impact:** Approximately 60% of our SMB clients run PHP-based applications (WordPress, custom PHP apps, Laravel frameworks). Most were on supported PHP versions and could patch immediately.

**Legacy risk:** Clients running end-of-life PHP versions (7.4, 8.0, 8.1) face the greatest risk. Many rely on hosting providers for updates, and not all providers have deployed patches yet.

**Recommended actions for SMBs:**
1. Contact your hosting provider immediately and confirm PHP version
2. If running PHP < 8.2, plan an urgent migration to a supported version
3. Review your web application firewall configuration
4. Implement automated security scanning for your PHP applications

**For enterprises:**
1. Inventory all PHP instances across on-premises and cloud environments
2. Prioritize patching internet-facing applications
3. Review PHP-FPM and mod_php configurations for additional hardening
4. Consider engaging a security firm for penetration testing post-patch

## Looking Ahead

PHP2Shell is a reminder that critical infrastructure vulnerabilities continue to emerge, even in mature, widely-deployed software. The fact that AI systems discovered these flaws suggests we'll see more automated vulnerability discovery in the future.

**What to watch:**
- Exploitation in the wild (Amazon identified pre-disclosure attempts on October 17; CISA issued alert but has not yet added to KEV catalog as of October 23)
- Additional vulnerabilities discovered through AI-assisted research
- Updates to PHP's memory management and error handling architecture

**Long-term recommendations:**
- Invest in automated dependency scanning and patch management
- Consider memory-safe languages (Rust, Go) for new critical infrastructure
- Support security research initiatives that combine AI and human expertise

## References

- [PHP Security Advisories - GitHub](https://github.com/php/php-src/security/advisories)
- [CVE-2026-109618 - GHSA-w8hw-w9fx-j79w](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w)
- [CVE-2026-109619 - GHSA-6wmf-4rv5-p3rp](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp)
- [CERT-EU Security Advisory 2026-018](https://cert.europa.eu/publications/security-advisories/2026-018)
- [Wiz Blog - PHP2Shell](https://www.wiz.io/blog/php2shell-php-rce)
- [OpenAI - Coordinated Disclosure of Critical Vulnerabilities](https://openai.com/index/coordinated-disclosure-of-critical-vulnerabilities/)
- [BleepingComputer - PHP ships emergency patches for critical PHP2Shell flaws](https://www.bleepingcomputer.com/news/security/php-ships-emergency-patches-for-critical-php2shell-flaws)
- [SecurityWeek - PHP2Shell: Mass Exploitation Looms for Leaked Critical PHP Flaws](https://www.securityweek.com/php2shell-mass-exploitation-looms-for-leaked-critical-php-flaws)

---

*Need help assessing your organization's exposure to PHP2Shell or implementing a comprehensive patch management strategy? VVG ONLINE's cybersecurity team can help. [Contact us](https://vvgonline.net/contact) for a security assessment.*

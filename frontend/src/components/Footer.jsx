// Simple SVG Icons
const GithubIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
  </svg>
);

const MailIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const socialLinks = [
  { icon: TwitterIcon, href: "#", label: "Twitter" },
  { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  { icon: GithubIcon, href: "#", label: "GitHub" },
  { icon: MailIcon, href: "#", label: "Email" },
];

const footerLinks = [
  {
    title: "Platform",
    links: [
      { name: "How it Works", href: "#" },
      { name: "Browse Jobs", href: "#" },
      { name: "Find Freelancers", href: "#" },
      { name: "Pricing", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "#" },
      { name: "Smart Contract Guide", href: "#" },
      { name: "API Documentation", href: "#" },
      { name: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Service", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Security", href: "#" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-primary/5 to-success/5 border-t border-border/50">
      {/* Enhanced darker background glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[radial-gradient(circle,_rgba(34,197,94,0.12)_0%,_transparent_70%)] opacity-40" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[radial-gradient(circle,_rgba(249,115,22,0.10)_0%,_transparent_70%)] opacity-30" />
      <div className="absolute top-1/3 right-[-6rem] w-64 h-64 bg-[radial-gradient(circle,_rgba(34,197,94,0.08)_0%,_transparent_70%)] opacity-25" />

      <div className="container mx-auto px-8 lg:px-16 relative z-10">
        {/* Main footer content */}
        <div className="py-16">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-gradient-green mb-4">Leavon</h3>
                <p className="text-muted-foreground leading-relaxed max-w-md">
                  The world's first decentralized freelance platform built on blockchain
                  technology. Secure, transparent, and fair for everyone.
                </p>
              </div>

              {/* Social links */}
              <div className="flex gap-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-success/10 hover:border-success/30 transition-all duration-300 hover:scale-110"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground hover:text-success" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links sections */}
            {footerLinks.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-6 text-foreground">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-success transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Security and audit info */}
        <div className="py-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldIcon className="w-4 h-4 text-success" />
                <span>Security Audited by CertiK</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileTextIcon className="w-4 h-4 text-success" />
                <a href="#" className="hover:text-success transition-colors">
                  Smart Contract Audit Report
                </a>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              © 2025 Leavon. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

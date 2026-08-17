"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { X, Mail, MessageSquare, HelpCircle } from "lucide-react"

interface LegalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "terms" | "privacy" | "contact"
}

const TermsOfServiceContent = () => (
  <div className="space-y-6 text-sm text-foreground">
    <div>
      <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
      <p className="text-muted-foreground leading-relaxed">
        By accessing and using Fable Together (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">2. Use License</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">
        Permission is granted to temporarily use Fable Together for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
        <li>Modify or copy the materials</li>
        <li>Use the materials for any commercial purpose or for any public display</li>
        <li>Attempt to reverse engineer any software contained in Fable Together</li>
        <li>Remove any copyright or other proprietary notations from the materials</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">3. User Accounts</h2>
      <p className="text-muted-foreground leading-relaxed">
        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. Fable Together reserves the right to refuse service, terminate accounts, or remove or edit content at our sole discretion.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">4. User-Generated Content</h2>
      <p className="text-muted-foreground leading-relaxed">
        You retain ownership of any content you create, upload, or share through Fable Together. By using our Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content solely for the purpose of providing and improving the Service.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">5. Prohibited Uses</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">
        You may not use Fable Together:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
        <li>In any way that violates any applicable law or regulation</li>
        <li>To transmit any material that is defamatory, offensive, or otherwise objectionable</li>
        <li>To impersonate or attempt to impersonate another user or person</li>
        <li>In any way that infringes upon the rights of others</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">6. Intellectual Property</h2>
      <p className="text-muted-foreground leading-relaxed">
        The Service and its original content, features, and functionality are and will remain the exclusive property of Fable Together and its licensors. The Service is protected by copyright, trademark, and other laws.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">7. Termination</h2>
      <p className="text-muted-foreground leading-relaxed">
        We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">8. Limitation of Liability</h2>
      <p className="text-muted-foreground leading-relaxed">
        In no event shall Fable Together, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">9. Changes to Terms</h2>
      <p className="text-muted-foreground leading-relaxed">
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">10. Contact Information</h2>
      <p className="text-muted-foreground leading-relaxed">
        If you have any questions about these Terms of Service, please contact us through our support channels.
      </p>
    </div>

    <div className="pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  </div>
)

const PrivacyPolicyContent = () => (
  <div className="space-y-6 text-sm text-foreground">
    <div>
      <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">
        We collect information that you provide directly to us, including:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
        <li>Account information (name, email address, password)</li>
        <li>Profile information and preferences</li>
        <li>Content you create, upload, or share (stories, voice recordings, etc.)</li>
        <li>Communication data when you contact us for support</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">
        We use the information we collect to:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send technical notices, updates, and support messages</li>
        <li>Respond to your comments and questions</li>
        <li>Monitor and analyze trends and usage</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">3. Information Sharing and Disclosure</h2>
      <p className="text-muted-foreground leading-relaxed">
        We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
        <li>With your consent</li>
        <li>To comply with legal obligations</li>
        <li>To protect our rights and safety</li>
        <li>With service providers who assist us in operating our platform</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">4. Data Security</h2>
      <p className="text-muted-foreground leading-relaxed">
        We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
      <p className="text-muted-foreground leading-relaxed mb-2">
        You have the right to:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
        <li>Access and receive a copy of your personal data</li>
        <li>Rectify inaccurate or incomplete data</li>
        <li>Request deletion of your personal data</li>
        <li>Object to or restrict processing of your data</li>
        <li>Data portability</li>
      </ul>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">6. Children's Privacy</h2>
      <p className="text-muted-foreground leading-relaxed">
        Fable Together is designed for family use. We take children&apos;s privacy seriously. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have that information removed.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">7. Cookies and Tracking Technologies</h2>
      <p className="text-muted-foreground leading-relaxed">
        We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">8. Third-Party Services</h2>
      <p className="text-muted-foreground leading-relaxed">
        Our Service may contain links to third-party websites or services that are not owned or controlled by Fable Together. We have no control over, and assume no responsibility for, the privacy policies or practices of any third-party services.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">9. Changes to This Privacy Policy</h2>
      <p className="text-muted-foreground leading-relaxed">
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
      </p>
    </div>

    <div>
      <h2 className="text-lg font-semibold mb-3">10. Contact Us</h2>
      <p className="text-muted-foreground leading-relaxed">
        If you have any questions about this Privacy Policy, please contact us through our support channels.
      </p>
    </div>

    <div className="pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  </div>
)

const ContactContent = () => (
  <div className="space-y-6 text-sm text-foreground">
    <div>
      <h2 className="text-lg font-semibold mb-3">Get in Touch</h2>
      <p className="text-muted-foreground leading-relaxed">
        We&apos;d love to hear from you! Whether you have questions, feedback, or need support, we&apos;re here to help.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Email Support</h3>
            <p className="text-muted-foreground text-sm">
              For general inquiries, support questions, or feedback, please email us at:
            </p>
            <a 
              href="mailto:support@fabletogether.com" 
              className="text-primary hover:underline font-medium"
            >
              support@fabletogether.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Help & Support</h3>
            <p className="text-muted-foreground text-sm">
              Need help getting started? Check out our help center or reach out for assistance.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Feedback & Suggestions</h3>
            <p className="text-muted-foreground text-sm">
              Have ideas to improve Fable Together? We&apos;d love to hear your suggestions and feature requests.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="font-semibold mb-2">Response Time</h3>
          <p className="text-muted-foreground text-sm">
            We typically respond to all inquiries within 24-48 hours during business days. For urgent matters, please mark your email as urgent.
          </p>
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-border">
      <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">How do I get started?</h3>
          <p className="text-muted-foreground text-sm">
            Simply create an account and start creating your first story! Check out our onboarding quests for a guided tour.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">How does voice cloning work?</h3>
          <p className="text-muted-foreground text-sm">
            Record a few minutes of audio from a family member, and our AI will create a voice model that can narrate stories in their voice.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Is my data secure?</h3>
          <p className="text-muted-foreground text-sm">
            Yes! We take privacy and security seriously. All your data is encrypted and stored securely. See our Privacy Policy for more details.
          </p>
        </div>
      </div>
    </div>

    <div className="pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        We&apos;re committed to providing excellent support and making Fable Together the best storytelling platform for families.
      </p>
    </div>
  </div>
)

export function LegalModal({ open, onOpenChange, type }: LegalModalProps) {
  const isTerms = type === "terms"
  const isPrivacy = type === "privacy"
  
  const title = isTerms 
    ? "Terms of Service" 
    : isPrivacy 
    ? "Privacy Policy" 
    : "Contact Us"
    
  const description = isTerms
    ? "Please read these terms carefully before using Fable Together."
    : isPrivacy
    ? "This Privacy Policy describes how we collect, use, and protect your information."
    : "Get in touch with our team for support, feedback, or questions."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-5xl lg:!max-w-6xl w-[95vw] sm:w-[90vw] md:w-auto max-h-[90vh] overflow-y-auto modal-slide-up"
      >
        <DialogClose className="absolute top-4 right-4 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:pointer-events-none bg-transparent hover:bg-transparent">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isTerms ? (
            <TermsOfServiceContent />
          ) : isPrivacy ? (
            <PrivacyPolicyContent />
          ) : (
            <ContactContent />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


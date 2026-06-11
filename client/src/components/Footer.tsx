import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-white pt-12 pb-6 text-[#102a47]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="h-10 mb-4 flex items-center">
              <div className="flex items-center">
                <img
                  src="/images/footer-logo.png"
                  alt="WorkWise SA Logo"
                  className="h-8 w-auto mr-2"
                />
                <span className="text-xl font-bold text-[#102a47]">
                  WORK<span className="text-[#f2c94c]">WISE.SA</span>
                </span>
              </div>
            </div>
            <p className="text-[#102a47]/85 mb-4">
              The Entry Level Jobs Directory is an online platform specifically designed to connect
              young South Africans with entry-level employment opportunities that require minimal
              experience or qualifications.
            </p>
            <div className="flex space-x-4">
              {' '}
              <a
                href="https://www.facebook.com/profile.php?id=61575790149796"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f2c94c] hover:text-[#ffdf66]"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>{' '}
              <a
                href="https://x.com/WorkWise_SA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f2c94c] hover:text-[#ffdf66]"
                aria-label="X (formerly Twitter)"
              >
                <i className="fab fa-x-twitter"></i>
              </a>{' '}
              <a
                href="https://www.linkedin.com/in/work-wise-sa-36a133370/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f2c94c] hover:text-[#ffdf66]"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="https://www.instagram.com/work.wise_sa/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f2c94c] hover:text-[#ffdf66]"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#f2c94c]">For Job Seekers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Career Resources
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/cv-templates"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  CV Templates
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/interview-tips"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  Interview Tips
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/salary-guide"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  Salary Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#f2c94c]">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/employers/post-job" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  href="/employers/dashboard"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  Employer Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/employers/solutions"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  Recruitment Solutions
                </Link>
              </li>
              <li>
                <Link href="/employers/pricing" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/employers/success-stories"
                  className="text-[#102a47]/85 hover:text-[#f2c94c]"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-[#f2c94c]">About Us</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#102a47]/85 hover:text-[#f2c94c]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#102a47]/20 text-center text-sm text-[#102a47]/70">
          <p>&copy; {new Date().getFullYear()} WorkWise SA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

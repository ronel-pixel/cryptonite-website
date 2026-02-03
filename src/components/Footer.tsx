import type { FC } from 'react';

const Footer: FC = () => (
  <footer className="app-footer" role="contentinfo">
    <p className="footer-text">Enclave 2026 | created by Ronel</p>
    <p className="footer-attribution">
      <a
        href="https://www.flaticon.com/free-icons/cryptocurrency"
        title="cryptocurrency icons"
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '10px', opacity: 0.6 }}
      >
        Cryptocurrency icons created by Eucalyp - Flaticon
      </a>
    </p>
  </footer>
);

export default Footer;

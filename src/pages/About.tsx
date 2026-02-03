import { Github, Linkedin, Code2, Database, Brain, Palette, Shield } from 'lucide-react';
import profileImage from '../assets/my-profile.jpeg';

export default function About() {
  return (
    <section className="about-page" aria-label="About">
      <div className="about-page__inner">
        <header className="about-page__header">
          <h1 className="about-page__title">About the Project</h1>
          <p className="about-page__subtitle">
            A high-end Crypto Management Application with real-time data integration and AI-driven insights.
          </p>
        </header>

        <div className="about-project">
          <p className="about-project__intro">
            This platform is an <strong>end-to-end financial dashboard</strong> that transforms raw API data
            into actionable AI insights. Built with modern web technologies, it demonstrates advanced
            implementation of state management, API resilience, and intelligent data processing for
            cryptocurrency portfolio management.
          </p>

          <div className="about-project__expertise">
            <h3 className="about-project__expertise-title">Technical Implementation</h3>
            <ul className="about-project__skills">
              <li className="about-project__skill">
                <Code2 size={20} className="about-project__skill-icon" />
                <div className="about-project__skill-content">
                  <strong>Frontend Architecture</strong>
                  <span>React.js with TypeScript for robust, type-safe development and component-based architecture</span>
                </div>
              </li>
              <li className="about-project__skill">
                <Database size={20} className="about-project__skill-icon" />
                <div className="about-project__skill-content">
                  <strong>State Management</strong>
                  <span>Redux Toolkit for complex, global state handling with asynchronous data flow and normalized state structure</span>
                </div>
              </li>
              <li className="about-project__skill">
                <Shield size={20} className="about-project__skill-icon" />
                <div className="about-project__skill-content">
                  <strong>API Resilience & Integration</strong>
                  <span>Advanced REST API management (CoinGecko/CryptoCompare) with custom throttling, caching, and exponential backoff retry logic to ensure 100% stability under rate-limit constraints</span>
                </div>
              </li>
              <li className="about-project__skill">
                <Brain size={20} className="about-project__skill-icon" />
                <div className="about-project__skill-content">
                  <strong>AI Integration</strong>
                  <span>OpenAI API implementation for personalized financial analysis and buy/hold/sell recommendations based on market data</span>
                </div>
              </li>
              <li className="about-project__skill">
                <Palette size={20} className="about-project__skill-icon" />
                <div className="about-project__skill-content">
                  <strong>UI/UX Design</strong>
                  <span>Responsive interface with modern CSS architecture, smooth animations, and accessibility-first design principles</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="about-developer">
          <h2 className="about-developer__heading">About the Developer</h2>
          <div className="about-developer__layout">
            <div className="about-developer__image-container">
              <img
                src={profileImage}
                alt="Ronel — Developer"
                className="about-developer__image"
              />
            </div>
            <div className="about-developer__content">
              <p className="about-developer__bio">
                <strong>Ronel</strong> is a full-stack developer specializing in <strong>React</strong> and{' '}
                <strong>TypeScript</strong>, with expertise in building scalable web applications and
                implementing complex state management solutions. This project demonstrates proficiency in
                modern frontend architecture, API integration patterns, and AI-powered feature development.
              </p>
              <p className="about-developer__role">
                Developer of this application. Founder of <strong>Enclave</strong>.
              </p>
              <div className="about-developer__links">
                <a
                  href="https://github.com/ronel-pixel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-developer__link"
                  aria-label="GitHub"
                >
                  <Github size={22} />
                </a>
                <a
                  href="https://www.linkedin.com/in/ronel-s-5998a9352"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-developer__link"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={22} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

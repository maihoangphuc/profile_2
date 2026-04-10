import { SOCIAL_LINKS } from "@/constants/socialLinks";

export default function ExperienceUi() {
  return (
    <div id="ui">
      <div id="brand">
        Greta
        <br />
        Thunberg
      </div>

      <div id="timeline">
        <span>JAN</span>
        <div id="tl-bar">
          <div id="tl-progress" />
        </div>
        <span>DEC</span>
      </div>

      <div id="social">
        <div id="sline" />
        {SOCIAL_LINKS.map((link, index) => (
          <a
            key={link.key}
            className="soc"
            data-key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            autoFocus={index === 0}
          >
            <span className="soc-label">{link.label}</span>
          </a>
        ))}
      </div>

      <div id="year-lbl">2019</div>
      <div id="month-lbl">Jan</div>
      <div id="month-lbl-ghost" aria-hidden="true">
        Jan
      </div>

      <div id="sound-btn" role="button" tabIndex={0} aria-label="Play or pause">
        <svg
          className="icon-play"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M8 5.5v13l11-6.5-11-6.5Z" />
        </svg>
        <svg
          className="icon-pause"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
        >
          <rect x="6.5" y="5.5" width="4.2" height="13" rx="1.1" />
          <rect x="13.3" y="5.5" width="4.2" height="13" rx="1.1" />
        </svg>
      </div>

      <div id="caption">
        <div id="cap-tag">VIDEO</div>
        <div id="cap-body" />
      </div>
    </div>
  );
}

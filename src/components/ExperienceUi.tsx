import { SOCIAL_LINKS } from "@/constants/socialLinks";
import { IconPause } from "@/icons/IconPause";
import { IconPlay } from "@/icons/IconPlay";

export default function ExperienceUi() {
  return (
    <div id="ui" className="text-web-white">
      <div id="brand">
        Greta
        <br />
        Thunberg
      </div>

      <div id="timeline">
        <span>JAN</span>
        <div id="tl-bar" className="bg-web-tl-track">
          <div id="tl-progress" className="bg-web-accent" />
        </div>
        <span>DEC</span>
      </div>

      <div id="social">
        <div id="sline" className="bg-web-white" />
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

      <div id="year-lbl" className="text-web-year">
        2019
      </div>
      <div id="month-lbl" className="text-web-strong">
        Jan
      </div>
      <div id="month-lbl-ghost" className="text-web-strong" aria-hidden="true">
        Jan
      </div>

      <div
        id="sound-btn"
        className="border border-web-border text-web-accent-icon"
        role="button"
        tabIndex={0}
        aria-label="Play or pause"
      >
        <IconPlay />
        <IconPause />
      </div>

      <div id="caption">
        <div id="cap-tag">VIDEO</div>
        <div id="cap-body" />
      </div>
    </div>
  );
}

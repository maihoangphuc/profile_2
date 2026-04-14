const INTRO_DESCRIPTION =
  "An illustrated timeline of how Greta Thunberg rose from a solo campaigner to the leader of a global movement in 2019.";

const INTRO_RIGHT_TEXT =
  "With her urgent appeals for climate protection Greta Thunberg has quickly become one of the most visible spokespeople of the climate movement.";

export default function ExperienceIntro() {
  return (
    <>
      <div id="bg-name">
        <div>
          <div className="bg-name-text text-web-name">Hoang</div>
          <div className="bg-name-text text-web-name">Phuc</div>
        </div>
      </div>

      <div id="intro-left">
        <div id="intro-rule-track">
          <div id="intro-rule" className="bg-web-white" />
        </div>
        <div
          id="intro-desc"
          className="text-web-muted"
          aria-label={INTRO_DESCRIPTION}
        >
          {INTRO_DESCRIPTION.split(" ").map((word, i) => (
            <span
              key={i}
              className="intro-word"
              style={{
                display: "inline-block",
                marginRight: "0.25em",
                opacity: 0,
                transform: "translateY(8px)",
              }}
            >
              {word}
            </span>
          ))}
        </div>
        <button id="explore-btn" className="text-web-white" type="button">
          <span className="explore-text">
            {"Explore".split("").map((c, i) => (
              <span
                key={i}
                className="explore-char"
                style={{ display: "inline-block" }}
              >
                {c === " " ? "\u00A0" : c}
              </span>
            ))}
          </span>
          <span id="explore-underline" />
        </button>
      </div>

      <div id="intro-right">
        <div id="intro-right-text" className="text-web-soft">
          {INTRO_RIGHT_TEXT}
        </div>
        <button id="read-more" className="text-web-label" type="button">
          <span className="read-more-text">Read More</span>
          <span id="read-more-underline" />
        </button>
      </div>
    </>
  );
}

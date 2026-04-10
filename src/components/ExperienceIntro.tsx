const INTRO_DESCRIPTION =
  "An illustrated timeline of how Greta Thunberg rose from a solo campaigner to the leader of a global movement in 2019.";

const INTRO_RIGHT_TEXT =
  "With her urgent appeals for climate protection Greta Thunberg has quickly become one of the most visible spokespeople of the climate movement.";

export default function ExperienceIntro() {
  return (
    <>
      <div id="bg-name">
        <div>
          <div className="bg-name-text">Hoang</div>
          <div className="bg-name-text">Phuc</div>
        </div>
      </div>

      <div id="intro-left">
        <div id="intro-rule" />
        <div id="intro-desc">{INTRO_DESCRIPTION}</div>
        <button id="explore-btn">Explore</button>
      </div>

      <div id="intro-right">
        <div id="intro-right-text">{INTRO_RIGHT_TEXT}</div>
        <button id="read-more">Read More</button>
      </div>
    </>
  );
}

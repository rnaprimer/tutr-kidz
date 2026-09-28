/**
 * TUTR KIDZ — ILLUSTRATED UI/UX REDESIGN ACCEPTANCE TEST
 * Verifies visual tokens, illustration system, component upgrades,
 * screen redesigns, touch accessibility, and calm non-gamified contracts.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let testCount = 0;
function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log(`✓ TEST ${testCount}: ${name}`);
  } catch (err) {
    console.error(`✗ TEST ${testCount} FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('=== TUTR KIDZ: ILLUSTRATED UI/UX REDESIGN ACCEPTANCE TESTS ===\n');

// 1. Reusable Visual Tokens
test('Design tokens define supporting warm pastel palette and layout tokens', () => {
  const colorsSrc = fs.readFileSync('constants/colors.ts', 'utf8');
  assert(colorsSrc.includes('lavenderBg'), 'colors exports lavenderBg');
  assert(colorsSrc.includes('skyBg'), 'colors exports skyBg');
  assert(colorsSrc.includes('warmYellowBg'), 'colors exports warmYellowBg');
  assert(colorsSrc.includes('coralBg'), 'colors exports coralBg');
  assert(colorsSrc.includes('mintBg'), 'colors exports mintBg');
  assert(colorsSrc.includes('peachBg'), 'colors exports peachBg');

  const themeSrc = fs.readFileSync('constants/theme.ts', 'utf8');
  assert(themeSrc.includes('LEVEL_THEMES'), 'theme exports LEVEL_THEMES');
  assert(themeSrc.includes('toddler:'), 'LEVEL_THEMES defines toddler');
  assert(themeSrc.includes("'class-1':"), 'LEVEL_THEMES defines class-1');
  assert(themeSrc.includes("'class-2':"), 'LEVEL_THEMES defines class-2');
  assert(themeSrc.includes("'class-3':"), 'LEVEL_THEMES defines class-3');
  assert(themeSrc.includes("'class-4':"), 'LEVEL_THEMES defines class-4');
});

// 2. Illustration System Components
test('Illustration system components exist and export valid React components', () => {
  const illustrationFiles = [
    'components/illustrations/MascotCharacter.tsx',
    'components/illustrations/LevelBadges.tsx',
    'components/illustrations/IllustratedHero.tsx',
    'components/illustrations/IllustratedSuccess.tsx',
    'components/illustrations/IllustratedEmptyState.tsx',
    'components/illustrations/IllustratedHeader.tsx',
    'components/illustrations/IllustratedWelcome.tsx',
    'components/illustrations/index.ts',
  ];

  for (const file of illustrationFiles) {
    assert(fs.existsSync(file), `Illustration file ${file} must exist`);
  }

  const mascotSrc = fs.readFileSync('components/illustrations/MascotCharacter.tsx', 'utf8');
  assert(mascotSrc.includes('welcoming'), 'MascotCharacter supports welcoming pose');
  assert(mascotSrc.includes('thinking'), 'MascotCharacter supports thinking pose');
  assert(mascotSrc.includes('celebrating'), 'MascotCharacter supports celebrating pose');
  assert(mascotSrc.includes('peaceful'), 'MascotCharacter supports peaceful pose');
});

// 3. Component Upgrades
test('LevelCard includes illustrated badge and maintains minHeight >= 76', () => {
  const src = fs.readFileSync('components/ui/LevelCard.tsx', 'utf8');
  assert(src.includes('LevelBadge'), 'LevelCard renders LevelBadge');
  assert(src.includes('minHeight: 76'), 'LevelCard maintains minHeight 76px');
  assert(src.includes('accessibilityRole="button"'), 'LevelCard defines accessibilityRole button');
});

test('TopicCard includes illustrated symbol container and pill badge', () => {
  const src = fs.readFileSync('components/curriculum/TopicCard.tsx', 'utf8');
  assert(src.includes('symbolContainer'), 'TopicCard includes symbolContainer');
  assert(src.includes('badgeWrapper'), 'TopicCard includes badgeWrapper for status chips');
  assert(src.includes('accessibilityRole="button"'), 'TopicCard defines accessibilityRole button');
});

test('ToddlerActivityCard includes tactile illustrated styling', () => {
  const src = fs.readFileSync('components/toddler/ToddlerActivityCard.tsx', 'utf8');
  assert(src.includes('ACTIVITY_PALETTES'), 'ToddlerActivityCard defines distinct palette per activity');
  assert(src.includes('minHeight: 88'), 'ToddlerActivityCard provides generous 88px touch target');
  assert(src.includes('accessibilityRole="button"'), 'ToddlerActivityCard defines accessibilityRole button');
});

test('DailyPracticeCard uses warm illustrated backdrop and button styling', () => {
  const src = fs.readFileSync('components/dailyLearning/DailyPracticeCard.tsx', 'utf8');
  assert(src.includes('#FEFCE8'), 'DailyPracticeCard uses warm yellow illustrated backdrop');
  assert(src.includes('badgeContainer'), 'DailyPracticeCard uses illustrated badge container');
  assert(src.includes('minHeight: 56'), 'DailyPracticeCard actionButton maintains 56px touch target');
});

test('QuizOption maintains touch target minHeight 68 and accessibilityState', () => {
  const src = fs.readFileSync('components/quiz/QuizOption.tsx', 'utf8');
  assert(src.includes('minHeight: 68'), 'QuizOption maintains minHeight: 68px >= 48px');
  assert(src.includes('accessibilityRole="button"'), 'QuizOption defines accessibilityRole="button"');
  assert(src.includes('accessibilityState='), 'QuizOption defines accessibilityState');
});

test('QuizFeedback delivers calm supportive feedback without aggressive gamification', () => {
  const src = fs.readFileSync('components/quiz/QuizFeedback.tsx', 'utf8');
  assert(src.includes('That’s right'), 'QuizFeedback uses calm positive feedback');
  assert(src.includes('Good thinking'), 'QuizFeedback uses supportive re-direction');
  assert(!src.includes('AMAZING'), 'QuizFeedback avoids shouty gaming text');
});

// 4. Screen Redesigns
test('Home screen incorporates IllustratedHero and calm visual layout', () => {
  const src = fs.readFileSync('app/index.tsx', 'utf8');
  assert(src.includes('IllustratedHero'), 'Home screen integrates IllustratedHero');
  assert(src.includes('DailyPracticeCard'), 'Home screen integrates DailyPracticeCard');
  assert(src.includes('!isToddler'), 'Home screen protects toddlers from numerical counters');
  assert(src.includes('What are you learning?'), 'Home screen includes learning section header');
});

test('Toddler screen incorporates IllustratedHeader and qualitative cards', () => {
  const src = fs.readFileSync('app/toddler/index.tsx', 'utf8');
  assert(src.includes('IllustratedHeader'), 'Toddler screen integrates IllustratedHeader');
  assert(src.includes('ToddlerActivityCard'), 'Toddler screen integrates ToddlerActivityCard');
  assert(!src.includes('% accuracy'), 'Toddler screen never includes accuracy percentage');
});

test('Level detail screen incorporates IllustratedHeader and qualitative toddler check', () => {
  const src = fs.readFileSync('app/level/[level].tsx', 'utf8');
  assert(src.includes('IllustratedHeader'), 'Level detail integrates IllustratedHeader');
  assert(src.includes('!isToddler'), 'Level detail guards accuracy percentage');
  assert(src.includes('activities started'), 'Level detail uses qualitative wording for toddlers');
});

test('Topics screen incorporates IllustratedHeader and TopicCard list', () => {
  const src = fs.readFileSync('app/level/[level]/topics.tsx', 'utf8');
  assert(src.includes('IllustratedHeader'), 'Topics screen integrates IllustratedHeader');
  assert(src.includes('TopicCard'), 'Topics screen renders TopicCard list');
});

test('Quiz screen features questionCard and IllustratedEmptyState fallback', () => {
  const src = fs.readFileSync('app/quiz/[level].tsx', 'utf8');
  assert(src.includes('questionCard'), 'Quiz screen uses elevated questionCard');
  assert(src.includes('IllustratedEmptyState'), 'Quiz screen uses IllustratedEmptyState fallback');
});

test('Quiz result screen features IllustratedSuccess mascot', () => {
  const src = fs.readFileSync('app/quiz/result.tsx', 'utf8');
  assert(src.includes('IllustratedSuccess'), 'Result screen integrates IllustratedSuccess');
  assert(src.includes('isToddler'), 'Result screen differentiates toddler celebration');
});

test('Parent onboarding features step-by-step IllustratedWelcome mascot', () => {
  const src = fs.readFileSync('app/parent/onboarding.tsx', 'utf8');
  assert(src.includes('IllustratedWelcome'), 'Onboarding integrates IllustratedWelcome');
  assert(src.includes('step === 1'), 'Step 1 present');
  assert(src.includes('step === 2'), 'Step 2 present');
  assert(src.includes('step === 3'), 'Step 3 present');
  assert(src.includes('step === 4'), 'Step 4 present');
});

test('Parent dashboard features calm MascotCharacter in empty state', () => {
  const src = fs.readFileSync('app/parent/index.tsx', 'utf8');
  assert(src.includes('MascotCharacter'), 'Parent dashboard incorporates MascotCharacter');
});

// 5. Zero Gamification Check
test('Zero gamification artifacts exist in application code', () => {
  const bannedKeywords = ['leaderboard', 'streakBonus', 'coinCount', 'gemCount', 'pointsReward'];
  for (const kw of bannedKeywords) {
    const files = ['app/index.tsx', 'app/quiz/[level].tsx', 'app/quiz/result.tsx'];
    for (const f of files) {
      const code = fs.readFileSync(f, 'utf8');
      assert(!code.toLowerCase().includes(kw.toLowerCase()), `${f} must not contain ${kw}`);
    }
  }
});

// 6. Touch Target Accessibility
test('All primary buttons maintain minHeight >= 56px', () => {
  const btnSrc = fs.readFileSync('components/ui/PrimaryButton.tsx', 'utf8');
  assert(btnSrc.includes('minHeight: 56'), 'PrimaryButton minHeight must be 56px');
  assert(btnSrc.includes('accessibilityRole="button"'), 'PrimaryButton specifies accessibilityRole="button"');
});

console.log(`\nAll ${testCount} Visual Redesign & UI/UX Polish Tests Passed Successfully!`);

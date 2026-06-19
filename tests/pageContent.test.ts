import { describe, it, expect } from 'vitest';
import { parseMarkdown, getPageContent, getPageSkills, type PageContent, type SkillCategory } from '../src/lib/cms';

describe('Page Content - parseMarkdown for pages collection', () => {
  it('parses home-hero frontmatter correctly', () => {
    const raw = `---
title: Home Hero
slug: home-hero
headline: ARBAB MUJTABA
nameLines: [ARBAB, MUJTABA]
identityLine1: "Software engineer & photographer,"
identityLine2: "drawn to where systems and stories meet."
tagline: "Building systems, documenting light, chasing quiet mysteries."
cinematicImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85"
---
`;
    const { data, content } = parseMarkdown(raw);
    expect(data.title).toBe('Home Hero');
    expect(data.slug).toBe('home-hero');
    expect(data.headline).toBe('ARBAB MUJTABA');
    expect(data.identityLine1).toBe('Software engineer & photographer,');
    expect(data.identityLine2).toBe('drawn to where systems and stories meet.');
    expect(data.tagline).toBe('Building systems, documenting light, chasing quiet mysteries.');
    expect(data.cinematicImage).toBe('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85');
    expect(Array.isArray(data.nameLines)).toBe(true);
    expect(data.nameLines).toContain('ARBAB');
    expect(data.nameLines).toContain('MUJTABA');
  });

  it('parses portfolio-hero frontmatter correctly', () => {
    const raw = `---
title: Portfolio
slug: portfolio-hero
headline: Portfolio
subtitle: "A collection of engineering case studies. Building with an emphasis on performance, precision, and robust architectures."
---
`;
    const { data } = parseMarkdown(raw);
    expect(data.title).toBe('Portfolio');
    expect(data.slug).toBe('portfolio-hero');
    expect(data.headline).toBe('Portfolio');
    expect(data.subtitle).toBe('A collection of engineering case studies. Building with an emphasis on performance, precision, and robust architectures.');
  });

  it('parses journal-hero with category descriptions', () => {
    const raw = `---
title: Journal
slug: journal-hero
headline: Journal
subtitle: "A personal archive."
categoryLife: "Personal experiences."
categoryPeople: "Stories about people."
---
`;
    const { data } = parseMarkdown(raw);
    expect(data.categoryLife).toBe('Personal experiences.');
    expect(data.categoryPeople).toBe('Stories about people.');
  });

  it('parses collection-hero with curatorsNote', () => {
    const raw = `---
title: Collection
slug: collection-hero
headline: Collection
curatorsNote: "We are the product of what we consume."
---
`;
    const { data } = parseMarkdown(raw);
    expect(data.curatorsNote).toBe('We are the product of what we consume.');
  });

  it('parses portfolio-skills JSON from frontmatter', () => {
    const skillsJson = JSON.stringify([
      { category: "Java", items: ["Swing", "JDBC"] },
      { category: "Python", items: ["Scripting"] }
    ]);
    const raw = `---
title: Portfolio Skills
slug: portfolio-skills
skillsJson: >
  ${skillsJson}
---
`;
    const { data } = parseMarkdown(raw);
    expect(data.skillsJson).toBe(skillsJson);
    const parsed = JSON.parse(data.skillsJson);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].category).toBe('Java');
    expect(parsed[0].items).toContain('Swing');
  });
});

describe('getPageContent', () => {
  it('returns page content for existing slugs', () => {
    const homeHero = getPageContent('home-hero');
    expect(homeHero).not.toBeNull();
    expect(homeHero!.slug).toBe('home-hero');
    expect(homeHero!.headline).toBe('ARBAB MUJTABA');
    expect(homeHero!.cinematicImage).toBeDefined();
  });

  it('returns page content for portfolio-hero', () => {
    const portfolioHero = getPageContent('portfolio-hero');
    expect(portfolioHero).not.toBeNull();
    expect(portfolioHero!.title).toBe('Portfolio');
    expect(portfolioHero!.subtitle).toContain('engineering case studies');
  });

  it('returns page content for tech-hero', () => {
    const techHero = getPageContent('tech-hero');
    expect(techHero).not.toBeNull();
    expect(techHero!.title).toBe('Tech');
    expect(techHero!.subtitle).toContain('digital laboratory');
  });

  it('returns page content for journal-hero', () => {
    const journalHero = getPageContent('journal-hero');
    expect(journalHero).not.toBeNull();
    expect(journalHero!.title).toBe('Journal');
    expect(journalHero!.categoryLife).toBeDefined();
  });

  it('returns page content for photography-hero', () => {
    const photoHero = getPageContent('photography-hero');
    expect(photoHero).not.toBeNull();
    expect(photoHero!.title).toBe('Photography');
    expect(photoHero!.subtitle).toContain('moments gathered');
  });

  it('returns page content for collection-hero', () => {
    const collectionHero = getPageContent('collection-hero');
    expect(collectionHero).not.toBeNull();
    expect(collectionHero!.title).toBe('Collection');
    expect(collectionHero!.curatorsNote).toBeDefined();
  });

  it('returns null for non-existent slug', () => {
    const result = getPageContent('non-existent-page');
    expect(result).toBeNull();
  });
});

describe('getPageSkills', () => {
  it('returns skills array from portfolio-skills page', () => {
    const skills = getPageSkills();
    expect(skills).not.toBeNull();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills!.length).toBe(8);
  });

  it('each skill has category and items array', () => {
    const skills = getPageSkills();
    expect(skills).not.toBeNull();
    for (const skill of skills!) {
      expect(typeof skill.category).toBe('string');
      expect(skill.category.length).toBeGreaterThan(0);
      expect(Array.isArray(skill.items)).toBe(true);
      expect(skill.items.length).toBeGreaterThan(0);
    }
  });

  it('includes expected skill categories', () => {
    const skills = getPageSkills();
    expect(skills).not.toBeNull();
    const categories = skills!.map(s => s.category);
    expect(categories).toContain('Java');
    expect(categories).toContain('Python');
    expect(categories).toContain('React');
    expect(categories).toContain('TypeScript');
    expect(categories).toContain('C++');
    expect(categories).toContain('Networking');
  });

  it('Java skills contain expected items', () => {
    const skills = getPageSkills();
    expect(skills).not.toBeNull();
    const java = skills!.find(s => s.category === 'Java');
    expect(java).toBeDefined();
    expect(java!.items).toContain('Swing');
    expect(java!.items).toContain('JDBC');
    expect(java!.items).toContain('OOP');
    expect(java!.items).toContain('Desktop Applications');
  });
});

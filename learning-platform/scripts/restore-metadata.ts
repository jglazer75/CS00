import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

const COMMIT_HASH = '0f91c500fd3bc719b6058014ccfbd8173af7f6a6^';
const CONTENT_DIR = 'content/CS01';

const FILE_MAP: Record<string, string> = {
  '01-foundations.md': 'foundations.md',
  '02-Negotiating-term-sheets.md': 'Negotiating-term-sheets.md',
  '02-the-deal.md': 'the-deal.md',
  '03-bigtech-confidential.md': 'bigtech-confidential.md',
  '03-the-exercise.md': 'the-exercise.md',
  '04-financials.md': 'financials.md',
  '05-pitch-competition.md': 'pitch-competition.md',
  'tips.md': 'tips.md',
};

function getHistoricalContent(filename: string): string {
  try {
    return execSync(`git show ${COMMIT_HASH}:learning-platform/content/CS01/${filename}`, { encoding: 'utf-8' });
  } catch (e) {
    console.warn(`Could not retrieve history for ${filename}`);
    return '';
  }
}

function restoreMetadata() {
  for (const [oldName, newName] of Object.entries(FILE_MAP)) {
    const historicalContent = getHistoricalContent(oldName);
    if (!historicalContent) continue;

    const { data: historicalData } = matter(historicalContent);
    const currentPath = path.join(process.cwd(), CONTENT_DIR, newName);
    
    if (!fs.existsSync(currentPath)) {
      console.warn(`Current file not found: ${currentPath}`);
      continue;
    }

    const currentFileContent = fs.readFileSync(currentPath, 'utf-8');
    const { content: currentBody, data: currentData } = matter(currentFileContent);

    // Merge/Normalize Metadata
    const mergedData = {
      title: historicalData.title || currentData.title || 'Untitled',
      description: historicalData.description || currentData.description,
      learning_objectives: historicalData.learning_objectives || [],
      core_concepts: historicalData.learning_concepts || historicalData.core_concepts || [],
      keywords: historicalData.keywords || [],
      pageId: currentData.pageId || historicalData.pageId, // Prefer current if set
      ...currentData // Keep any new fields added recently
    };

    // Ensure legacy 'learning_concepts' is removed in favor of 'core_concepts'
    delete (mergedData as any).learning_concepts;

    // Filter out undefined values to satisfy js-yaml
    const cleanData = Object.fromEntries(
      Object.entries(mergedData).filter(([_, v]) => v !== undefined)
    );

    const newContent = matter.stringify(currentBody, cleanData);
    fs.writeFileSync(currentPath, newContent);
    console.log(`Restored metadata for ${newName}`);
  }
}

restoreMetadata();

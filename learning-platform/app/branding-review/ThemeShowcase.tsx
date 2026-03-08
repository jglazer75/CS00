'use client'; // Required for Next.js App Router

import React, { useState } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import { Box, Container, Typography, ToggleButtonGroup, ToggleButton, Grid, Divider, CssBaseline, Paper, Stack } from '@mui/material';

// Import Themes
import { themeA } from './themes/themeA';
import { themeB } from './themes/themeB';
import { themeC } from './themes/themeC';

// Import Components from Theme A folders (internally styled via useTheme)
import * as ComponentA from './themeA';
import * as ComponentB from './themeB';
import * as ComponentC from './themeC';

const themes = {
  A: { theme: themeA, name: 'Gilded Gavel', comps: ComponentA, desc: 'Law Firm / Prestige' },
  B: { theme: themeB, name: 'Innovation Incubator', comps: ComponentB, desc: 'EdTech / Startup' },
  C: { theme: themeC, name: 'Blueprint Collective', comps: ComponentC, desc: 'Architectural / Modernist' },
};

type ThemeKey = keyof typeof themes;

// Dummy Data
const dummyObjective = 'Analyze the historical development of corporate veil piercing doctrines in Wisconsin courts.';
const objectiveList = [dummyObjective, 'Apply the "alter ego" test to specific farm incorporation scenarios.', 'Draft operating agreement clauses that minimize liability risks for agricultural entrepreneurs.'];
const conceptList = ['Limited Liability', 'Alter Ego Doctrine', 'Formalities', 'Fiduciary Duty'];
const keywordList = ['Tort', 'Contract', 'LLC', 'Shareholder', 'Equity'];
const sections = [
  { id: 'intro', title: 'Introduction to Entity Selection' },
  { id: 'liability', title: 'The Liability Shield' },
  { id: 'taxation', title: 'Tax Implications for Rural Businesses' },
  { id: 'case-study', title: 'Case Study: Jones Family Farm' },
];

export default function ThemeShowcase() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('A');
  const [activeSection] = useState('liability');

  const handleThemeChange = (event: React.MouseEvent<HTMLElement>, newTheme: ThemeKey | null) => {
    if (newTheme !== null) {
      setSelectedTheme(newTheme);
    }
  };

  const { theme, comps: C, name, desc } = themes[selectedTheme];

  return (
    // StyledEngineProvider ensures MUI styles have proper precedence during theme switching
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Handles background color shifts appropriately */}
        <Box sx={{ minHeight: '100vh', pb: 10 }}>
          
          {/* Theme Selector Toolbar (Fixed at top) */}
          <Paper elevation={4} square sx={{ position: 'sticky', top: 0, zIndex: 1100, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Container maxWidth="xl">
              <Grid container alignItems="center" spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="h4" component="h1" color="primary.main" sx={{fontWeight: 700}}>CS00 UI Lab</Typography>
                  <Typography variant="body2" color="text.secondary">Senior Design Pitch Showcase</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }} sx={{ textAlign: { md: 'right' } }}>
                  <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems="center" justifyContent={{md: 'flex-end'}}>
                    <Box>
                        <Typography variant="subtitle2" color="text.primary">{name}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{mt: -0.5}}>{desc}</Typography>
                    </Box>
                    <ToggleButtonGroup
                        value={selectedTheme}
                        exclusive
                        onChange={handleThemeChange}
                        aria-label="theme selector"
                        color="primary"
                        size="small"
                    >
                        <ToggleButton value="A">Theme A</ToggleButton>
                        <ToggleButton value="B">Theme B</ToggleButton>
                        <ToggleButton value="C">Theme C</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                </Grid>
              </Grid>
            </Container>
          </Paper>

          {/* Component Showcase Area */}
          <Container maxWidth="lg" sx={{ mt: 6 }}>
            
            {/* 8. ModuleLandingHero */}
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>8. ModuleLandingHero</Typography>
            <Box sx={{ mb: 8, mx: {xs: -2, sm: -3, md: 0} }}> {/* Bleed on mobile */}
                <C.ModuleLandingHero 
                    moduleTitle="Navigating Farm Liability"
                    description="A comprehensive case study regarding tort liability and corporate veil piercing for multi-generational agricultural enterprises in the Midwest."
                    author="Prof. Elizabeth Samuels, UW Law"
                    learningObjectives={objectiveList}
                    isEnrolled={false}
                    onStart={() => alert('Start')}
                    onEnroll={() => alert('Enroll')}
                />
            </Box>

            <Grid container spacing={4}>
                {/* Main Content Side */}
                <Grid size={{ xs: 12, md: 8 }}>
                    
                    {/* 3. MetadataCard */}
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>3. MetadataCard</Typography>
                    <C.MetadataCard 
                        learningObjectives={objectiveList}
                        coreConcepts={conceptList}
                        keywords={keywordList}
                    />

                    {/* 4. InstructorNoteCard */}
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>4. InstructorNoteCard</Typography>
                    <C.InstructorNoteCard 
                        pageTitle="The Liability Shield"
                        note="Students often struggle with the distinction between tort and contract liability when analyzing veil piercing. Remind them to focus on the *voluntary* nature of the relationship in contract cases versus the *involuntary* nature in tort. Refer to the *Seavey v. State* case in the reading."
                    />

                    {/* 2. ContentCard */}
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>2. ContentCard (Section 2)</Typography>
                    <C.ContentCard title="The Liability Shield" sectionIndex={2}>
                        <Typography variant="body1">
                            The primary motivation for incorporating a farm business is usually to create a specialized liability shield. This shield separates the personal assets of the farm owners (like their home or personal savings) from the business assets of the farm operation (like tractors, land, or livestock).
                        </Typography>
                        <Typography variant="body1">
                            However, this shield is not impenetrable. Under certain specific circumstances, courts may decide to <strong>&ldquo;pierce the corporate veil&rdquo;</strong> and hold the individual shareholders or members personally liable for the business&apos;s debts or legal obligations. This is particularly common in rural areas where business formalities might not be strictly observed over decades of family operation.
                        </Typography>
                        <ul>
                            <li>Formalities (holding meetings, keeping separate books)</li>
                            <li>Commingling of assets (paying personal bills from farm account)</li>
                            <li>Under-capitalization at formation</li>
                        </ul>
                    </C.ContentCard>

                    <Divider sx={{ my: 6 }} />

                    {/* Atomics section */}
                    <Typography variant="h5" gutterBottom sx={{mb: 3, fontWeight: 700}}>Atoms & Independent Components</Typography>
                    <Grid container spacing={3} alignItems="center">
                        {/* 6. ProgressRing */}
                        <Grid size={{ xs: 6, sm: 3 }} sx={{textAlign: 'center'}}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>6. ProgressRing</Typography>
                            <C.ProgressRing percent={75} label="Phase 1" />
                        </Grid>
                        {/* 7. RoleBadge */}
                        <Grid size={{ xs: 6, sm: 9 }}>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>7. RoleBadge</Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <C.RoleBadge role="student" />
                                <C.RoleBadge role="instructor" />
                                <C.RoleBadge role="module-owner" />
                                <C.RoleBadge role="admin" />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 6 }} />

                    {/* 1. ModuleCard Collection */}
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>1. ModuleCard (Selection Grid)</Typography>
                    <Grid container spacing={3} sx={{mt: 1}}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <C.ModuleCard 
                                title="Rural Entity Selection"
                                description="Choosing between LLC, S-Corp, and General Partnerships for agritourism ventures."
                                tags={["Corporate Law", "Entrepreneurs"]}
                                progressPercent={100}
                                isEnrolled={true}
                                isPublic={true}
                                onClick={() => alert('Clicked')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <C.ModuleCard 
                                title="Water Rights & Contracts"
                                description="Analyzing irrigation agreements and DNR permits for high-capacity wells."
                                tags={["Environmental", "Real Estate"]}
                                progressPercent={30}
                                isEnrolled={true}
                                isPublic={false}
                                onClick={() => alert('Clicked')}
                            />
                        </Grid>
                    </Grid>

                </Grid>

                {/* Sidebar Side */}
                <Grid size={{ xs: 12, md: 4 }}>
                    {/* 5. TableOfContents */}
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>5. TableOfContents</Typography>
                    <Paper elevation={selectedTheme === 'A' ? 0 : 1} sx={{p: selectedTheme === 'C' ? 0 : 2, bgcolor: selectedTheme === 'C' ? 'transparent' : 'background.paper', border: selectedTheme === 'C' ? 'none' : '1px solid', borderColor: 'divider'}}>
                        <C.TableOfContents 
                            sections={sections}
                            activeId={activeSection}
                        />
                    </Paper>
                </Grid>
            </Grid>

          </Container>
        </Box>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
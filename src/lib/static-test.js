import { StaticAnalysisService } from '../services/static-analysis.service.js';

async function testStaticAnalysis() {
  console.log(`--- Step 6 Verification: Static Analysis ---`);

  const mockFiles = [
    {
      path: 'src/auth.js',
      lines: 20,
      content: `
        export const login = (u) => { console.log("Login..."); }
        export const unusedFunction = () => { console.log("I am never used"); }
        
        // This is a long block to trigger duplicate detection
        function sharedLogic() {
          console.log("This is a very long line of code that we want to detect as a duplicate.");
          console.log("It needs to be long enough to pass the minLength threshold.");
          console.log("We are repeating this in another file purposefully.");
          console.log("Static analysis should find this easily.");
          console.log("Let's see if it works!");
        }
      `
    },
    {
      path: 'src/utils.js',
      lines: 15,
      content: `
        import { login } from './auth.js';
        
        // Duplicate block starts here
        function sharedLogic() {
          console.log("This is a very long line of code that we want to detect as a duplicate.");
          console.log("It needs to be long enough to pass the minLength threshold.");
          console.log("We are repeating this in another file purposefully.");
          console.log("Static analysis should find this easily.");
          console.log("Let's see if it works!");
        }
      `
    }
  ];

  const results = StaticAnalysisService.analyze(mockFiles);

  console.log(`\n1. Duplicates Found: ${results.duplicates.length}`);
  if (results.duplicates.length > 0) {
    console.log(`   - Found duplicate between: ${results.duplicates[0].files.join(' and ')}`);
  }

  console.log(`\n2. Unused Exports Found: ${results.unusedCode.length}`);
  results.unusedCode.forEach(item => console.log(`   - ${item.name} (${item.type})`));

  console.log(`\n3. Metrics:`);
  console.log(`   - Quality Score: ${results.metrics.qualityScore}/100`);
  console.log(`   - Total Lines: ${results.metrics.totalLines}`);

  console.log(`\nStep 6 Complete.`);
}

testStaticAnalysis();

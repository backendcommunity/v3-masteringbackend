# Exercise playground smoke (manual, full stack)

Prereqs: executor + academy + frontend running; an OUTPUT_MATCH exercise seeded
(language PYTHON, testCases [{ input: "2", expectedOutput: "4", description: "doubles" }], passMark 60).

1. Open a path/course whose current step is that EXERCISE.
2. Confirm the editor loads starter code and the language selector shows allowed languages.
3. Type `import sys; print(int(sys.stdin.read())*2)`, click "Run & Submit".
4. Expect: button shows "Grading…", then a green "PASSED — 100% (1/1)" panel.
5. Confirm the step advances (onComplete fired) and points/streak update on the dashboard.
6. Wrong code (`*3`): red "FAILED — 0% (0/1)" with the failing case; step does NOT complete.
7. Kill the socket (devtools offline briefly) after submit: the poll fallback still resolves the verdict within ~8s.

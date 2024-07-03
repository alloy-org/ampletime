/**
 * @jest-environment jsdom
 */

import {mockApp, mockPlugin, mockPrompter} from "../lib/test-helpers.js";
import {starting} from "../lib/amplefocus/amplefocus.js";

function createExpectedJot(cycleCount, trailingContent = "", leadingContent="") {
    return `${leadingContent}[Focus Dashboard](https://www.amplenote.com/notes/2) for ${cycleCount} cycles
## Session overview
- **What am I trying to accomplish?**
  - 1
- **Why is this important and valuable?**
  - 2
- **How will I know this is complete?**
  - 3
- **Potential distractions? How am I going to deal with them?**
  - 4
- **Is this concrete/measurable or subjective/ambiguous?**
  - 5
- **Anything else noteworthy?**
  - 6
## Cycles
### Cycle 1
- Plan:

- Debrief:

### Cycle 2
- Plan:

- Debrief:

### Cycle 3
- Plan:

- Debrief:

### Cycle 4
- Plan:

- Debrief:

### Cycle 5
- Plan:

- Debrief:

## Session debrief
${trailingContent}`;
}

function createExpectedDash(plugin, cycleCount = 5) {
    return `## ${plugin.options.amplefocus.sectionTitleDashboardEntries}
|${" |".repeat(plugin.options.amplefocus.dashboardColumns.length)}
|${"-|".repeat(plugin.options.amplefocus.dashboardColumns.length)}
| ${plugin.options.amplefocus.dashboardColumns.join(" | ")} |
| [June 12th, 2024](https://www.amplenote.com/notes/1) |`;
}

function createMockPrompter() {
    return mockPrompter([
        {index: 0},
        {index: 3}, // This means 5 cycles
        ["1", "2", "3", "4", "5", "6"],
        [1, 3], [2, 2], [3, 3], [3, 3], [1, 3],
    ]);
}

function setUpPluginAndApp(workDuration = 0.1, breakDuration = 0.05) {
    let app = mockApp();
    let plugin = mockPlugin();
    plugin.options.amplefocus.workDuration = workDuration * 1000;
    plugin.options.amplefocus.breakDuration = breakDuration * 1000;
    plugin.options.amplefocus.mockPrompter = createMockPrompter();
    return {app, plugin};
}

function createRunningSessionDash(plugin) {
    return `## ${plugin.options.amplefocus.sectionTitleDashboardEntries}
|${" |".repeat(plugin.options.amplefocus.dashboardColumns.length)}
|${"-|".repeat(plugin.options.amplefocus.dashboardColumns.length)}
| ${plugin.options.amplefocus.dashboardColumns.join(" | ")} |
| [June 12th, 2024](https://www.amplenote.com/notes/1) | 2024-06-19T16:14:36.532 | 5 | 2 |  |`;
}

function createInitialJotContents(trailingContent="", leadingContent="") {
    return `${leadingContent}
# **\\[16:14:36\\]** [Focus Dashboard](https://www.amplenote.com/notes/2) for 5 cycles
## Session overview
- **What am I trying to accomplish?**
  - 1
- **Why is this important and valuable?**
  - 2
- **How will I know this is complete?**
  - 3
- **Potential distractions? How am I going to deal with them?**
  - 4
- **Is this concrete/measurable or subjective/ambiguous?**
  - 5
- **Anything else noteworthy?**
  - 6
## Cycles
### Cycle 1
- Plan:

- Debrief:

### Cycle 2
- Plan:
${trailingContent}
`
}

function validateDashboardContents(app, expectedDash, expectedRowMatch) {
    expect(app._noteRegistry["2"].body).toContain(expectedDash);
    expect(app._noteRegistry["2"].body).toMatch(expectedRowMatch);
}

function validateJotContents(app, expectedJotContents) {
    expect(app._noteRegistry["1"].body).toContain(expectedJotContents);
}

describe("within a test environment", () => {
    let app, plugin;

    describe("with a newly started focus", () => {
        describe("with no dashboard", () => {
            beforeEach(() => {
                ({app, plugin} = setUpPluginAndApp());
            });

            //----------------------------------------------------------------------------------------------------------
            it("should create the dashboard and the first entry; it should log all session details", async () => {
                const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "", "1");
                app.context.noteUUID = "1";
                let cycleCount = 5;
                let expectedDash = createExpectedDash(plugin, cycleCount);
                let expectedRowMatch = /\|.*\|.*\| 5 \| 5 \| .* \|/;
                await plugin.insertText["Start Focus"](app);
                validateDashboardContents(app, expectedDash, expectedRowMatch);

                let expectedJot = createExpectedJot(cycleCount);
                validateJotContents(app, expectedJot);
            });
        });

        describe("with an empty dashboard", () => {
            beforeEach(() => {
                ({app, plugin} = setUpPluginAndApp());
            });

            //----------------------------------------------------------------------------------------------------------
            it("should create a new entry in the dashboard", async () => {
                const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "{AmpleFocus:Start}", "1");
                app.context.noteUUID = "1";
                let cycleCount = 5;
                await app.createNote(
                    plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard], "",
                    "2"
                );
                let expectedDash = createExpectedDash(plugin, cycleCount);
                const expectedJotContents = createExpectedJot(cycleCount);
                let expectedRowMatch = /\|.*\|.*\| 5 \| 5 \| .* \|/;
                await plugin.insertText["Start Focus"](app);
                validateDashboardContents(app, expectedDash, expectedRowMatch);
                validateJotContents(app, expectedJotContents);
            });

            describe("with longer durations", () => {
                beforeEach(() => {
                    ({app, plugin} = setUpPluginAndApp(10, 0.05));
                    let startTime = new Date();
                    plugin.options.amplefocus.mockPrompter = mockPrompter([
                        startTime.getTime(),
                        {index: 3}, // This means 5 cycles
                        ["1", "2", "3", "4", "5", "6"],
                        [1, 3], [2, 2], [3, 3], [3, 3], [1, 3],
                    ]);
                });

                //----------------------------------------------------------------------------------------------------------
                it("should pause a session", async () => {
                    const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "", "1");
                    app.context.noteUUID = "1";
                    await app.createNote(
                        plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard], "",
                        "2"
                    );
                    let expectedRowMatch = /\|.*\|.*\| 5 \| 0 \|  \|  \|  \|/;
                    let runPromise = plugin.insertText["Start Focus"](app);
                    runPromise.then(() => console.log("yes")).catch(() => console.log("no"));
                    await starting;
                    await plugin.appOption["Pause Focus"](app);

                    validateDashboardContents(app, "", expectedRowMatch);
                });

                //----------------------------------------------------------------------------------------------------------
                it("should cancel a session", async () => {
                    const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "", "1");
                    app.context.noteUUID = "1";
                    await app.createNote(
                        plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard], "",
                        "2"
                    );
                    let expectedRowMatch = /\|.*\|.*\| 5 \| 0 \|  \|  \| .+ \|/;
                    let runPromise = plugin.insertText["Start Focus"](app);
                    runPromise.then(() => console.log("yes")).catch(() => console.log("no"));
                    await starting;
                    await plugin.appOption["Cancel Focus"].bind(plugin)(app);

                    validateDashboardContents(app, "", expectedRowMatch);
                });

                //----------------------------------------------------------------------------------------------------------
                it("should cancel a paused session", async () => {
                    const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "", "1");
                    app.context.noteUUID = "1";
                    await app.createNote(
                        plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard], "",
                        "2"
                    );
                    let expectedRowMatch = /\|.*\|.*\| 5 \| 0 \|  \|  \| .+ \|/;
                    let runPromise = plugin.insertText["Start Focus"](app);
                    runPromise.then(() => console.log("yes")).catch(() => console.log("no"));
                    await starting;
                    await plugin.appOption["Pause Focus"](app);
                    await plugin.appOption["Cancel Focus"].bind(plugin)(app);

                    validateDashboardContents(app, "", expectedRowMatch);
                });
            });
        });

        describe("with a running session", () => {
            let dashContents;

            beforeEach(() => {
                ({app, plugin} = setUpPluginAndApp());
                dashContents = createRunningSessionDash(plugin);
            });

            describe("if the user abandons open session", () => {
                beforeEach(() => {
                    plugin.options.amplefocus.mockPrompter = mockPrompter([
                        "abandon",
                        {index: 0},
                        {index: 3}, // This means 5 cycles
                        ["1", "2", "3", "4", "5", "6"],
                        [1, 3], [2, 2], [3, 3], [3, 3], [1, 3],
                    ]);
                });

                //----------------------------------------------------------------------------------------------------------
                it("should stop the open session and start the new one", async () => {
                    const jot = await app.createNote("June 12th, 2024", ["daily-jots"], "", "1");
                    app.context.noteUUID = "1";
                    let cycleCount = 5;
                    await app.createNote(
                        plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard],
                        dashContents, "2"
                    );
                    let expectedDash = createExpectedDash(plugin, cycleCount);
                    let expectedRowMatch1 = /\|.*\|.*\| 5 \| 2 \| .* \|/;
                    let expectedRowMatch2 = /\|.*\|.*\| 5 \| 5 \| 1,2,3,3,1 \| 3,2,3,3,3 \| .* \|/;
                    await plugin.insertText["Start Focus"](app);
                    validateDashboardContents(app, expectedDash, expectedRowMatch2);
                    validateDashboardContents(app, expectedDash, expectedRowMatch1);
                });
            });

            describe("if the user resumes the open session", () => {
                beforeEach(() => {
                    plugin.options.amplefocus.mockPrompter = mockPrompter([
                        "resume",
                        {index: 0},
                        [3, 3], [3, 3], [1, 3],
                    ]);
                });

                //----------------------------------------------------------------------------------------------------------
                it("should resume the open session and leave the table intact", async () => {
                    const trailingContent = `# This is an unrelated section
And this is some content

---
This is some text without a heading per se

### Cycle 4
But please don't write here`;
                    const leadingContent = "Some unrelated text/n";
                    const initialJotContents = createInitialJotContents(trailingContent, leadingContent);
                    const jot = await app.createNote("June 12th, 2024", ["daily-jots"], initialJotContents, "1");
                    app.context.noteUUID = "1";
                    let cycleCount = 5;
                    await app.createNote(
                        plugin.options.amplefocus.noteTitleDashboard, [plugin.options.amplefocus.noteTagDashboard],
                        dashContents, "2"
                    );
                    let expectedDash = createExpectedDash(plugin, cycleCount);
                    let expectedRowMatch2 = /\|.*\|.*\| 5 \| 5 \| 3,3,1 \| 3,3,3 \| .* \|/;
                    let expectedJotContents = createExpectedJot(cycleCount, trailingContent);
                    await plugin.insertText["Start Focus"](app);
                    validateDashboardContents(app, expectedDash, expectedRowMatch2);
                    validateJotContents(app, expectedJotContents);
                });
            });
        });
    });
});
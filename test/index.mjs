import cookie from "./cookie.mjs";
import errors from "./errors.mjs";

class Test {
    constructor(name, fnc) {
        this.name = name
        this.fnc = fnc
    }
    async runTest() {
        return this.fnc();
    }
}

const tests = [
    cookie,
    errors
].flatMap(t => t(Test));

(async () => {
    console.log("running tests...");
    const testResults = await Promise.all(tests.map(async t => {
        try {
            t.result = await t.runTest();
            if(t.result !== !!t.result) {
                t.result = false;
                console.error("test did not return a boolean: " + t.name);
            }
        }
        catch(error) {
            console.error("uncaught error in test: " + t.name + "\n", error);
            t.result = false;
        }
        return t;
    }));
    testResults.forEach(t => {
        if(t.result)
            console.info("✔ " + t.name);
        else
            console.warn("✘ " + t.name);
    });
    const succeededTests = testResults.map(t => t.result).reduce((a, b) => a + b);
    const success = succeededTests === testResults.length;
    (success ? console.info : console.warn)((success ? "✔" : "✘") + " " + succeededTests + "/" + testResults.length + " tests successful");
    !success && process.exit(1);
})();

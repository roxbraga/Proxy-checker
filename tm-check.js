import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { saveTicketmasterResult, } from "./src/ticketmasterTracker.js";
const rl = readline.createInterface({
    input,
    output,
});
async function main() {
    console.log("=================================");
    console.log("    TICKETMASTER DIAGNOSTIC");
    console.log("=================================\n");
    console.log("Enter the Proxy name:");
    console.log("Example: Proxy47\n");
    const name = (await rl.question("Proxy: ")).trim();
    if (!name) {
        console.log("Proxy name is required.");
        rl.close();
        return;
    }
    console.log("\nSelect the result:");
    console.log("1. accessible");
    console.log("2. paused");
    console.log("3. security-check");
    console.log("4. blocked");
    console.log("5. error\n");
    const choice = (await rl.question("Result: ")).trim();
    const statusMap = {
        "1": "accessible",
        "2": "paused",
        "3": "security-check",
        "4": "blocked",
        "5": "error",
    };
    const status = statusMap[choice];
    if (!status) {
        console.log("Invalid result.");
        rl.close();
        return;
    }
    await saveTicketmasterResult({
        name,
        status,
        checkedAt: new Date().toISOString(),
    });
    console.log(`\nSaved: ${name} → ${status}`);
    rl.close();
}
main().catch((error) => {
    console.error("\nFatal error:");
    if (error instanceof Error) {
        console.error(error.message);
    }
    else {
        console.error(error);
    }
    process.exit(1);
});

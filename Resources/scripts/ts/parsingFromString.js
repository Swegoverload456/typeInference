"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parsing = require("./parsing");
var ts = require("typescript");
require("source-map-support/register");
var parsing_1 = require("./parsing");
var content = process.argv[2];
var source = ts.createSourceFile("temp.ts", content, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS);
var program = ts.createProgram([], {
    target: ts.ScriptTarget.ES2018,
    module: ts.ModuleKind.CommonJS
});
var checker = program.getTypeChecker();
program.getSemanticDiagnostics();
var out = [];
var parser = new parsing.StmtParser(checker);
source.statements.forEach(function (s) {
    var r = parser.parseStmt(s);
    if (!r) {
        throw new Error("failed for: " + s.getFullText(source));
    }
    out.push(parsing_1.flattenBlock(r));
});
console.log(JSON.stringify(out));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2luZ0Zyb21TdHJpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwYXJzaW5nRnJvbVN0cmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFxQztBQUNyQywrQkFBaUM7QUFDakMsdUNBQXFDO0FBQ3JDLHFDQUE4QztBQUU5QyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRTlCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUNqRCxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNsRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRTtJQUNqQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNO0lBQzlCLE1BQU0sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLFFBQVE7Q0FDL0IsQ0FBQyxDQUFDO0FBRUgsSUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pDLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBRWpDLElBQUksR0FBRyxHQUFZLEVBQUUsQ0FBQztBQUV0QixJQUFJLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFN0MsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO0lBQ3pCLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUN6RDtJQUNELEdBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDO0FBR0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMifQ==
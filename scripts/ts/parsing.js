"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var typescript_1 = require("typescript");
var GModule = /** @class */ (function () {
    function GModule(name, stmts) {
        this.name = name;
        this.stmts = stmts;
    }
    return GModule;
}());
exports.GModule = GModule;
function mustExist(v, msg) {
    if (!v) {
        if (msg) {
            throw new Error("Must exists! Message: " + msg);
        }
        else {
            throw new Error("Must exists!");
        }
    }
    return v;
}
exports.mustExist = mustExist;
var UserAnnot = /** @class */ (function () {
    function UserAnnot(ty) {
        this.ty = ty;
        this.category = "UserAnnot";
    }
    return UserAnnot;
}());
var Inferred = /** @class */ (function () {
    function Inferred(ty) {
        this.ty = ty;
        this.category = "Inferred";
    }
    return Inferred;
}());
var TVar = /** @class */ (function () {
    function TVar(name) {
        this.name = name;
        this.category = "TVar";
        mustExist(name);
    }
    return TVar;
}());
var AnyType = /** @class */ (function () {
    function AnyType() {
        this.category = "AnyType";
        this.name = "any";
    }
    AnyType.instance = new AnyType();
    return AnyType;
}());
var FuncType = /** @class */ (function () {
    function FuncType(args, to) {
        this.args = args;
        this.to = to;
        this.category = "FuncType";
    }
    return FuncType;
}());
var ObjectType = /** @class */ (function () {
    function ObjectType(fields) {
        this.fields = fields;
        this.category = "ObjectType";
    }
    return ObjectType;
}());
exports.anyType = AnyType.instance;
var basicTypes = new Map();
basicTypes.set(typescript_1.SyntaxKind.BooleanKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.TrueKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.FalseKeyword, "boolean");
basicTypes.set(typescript_1.SyntaxKind.NumberKeyword, "number");
basicTypes.set(typescript_1.SyntaxKind.StringKeyword, "string");
basicTypes.set(typescript_1.SyntaxKind.SymbolKeyword, "Symbol");
basicTypes.set(typescript_1.SyntaxKind.EnumKeyword, "Enum");
basicTypes.set(typescript_1.SyntaxKind.VoidKeyword, "void");
basicTypes.set(typescript_1.SyntaxKind.ObjectKeyword, "object");
basicTypes.set(typescript_1.SyntaxKind.BigIntKeyword, "BigInt");
var ignoredTypes = new Set();
ignoredTypes.add(typescript_1.SyntaxKind.MappedType);
ignoredTypes.add(typescript_1.SyntaxKind.ConditionalType);
ignoredTypes.add(typescript_1.SyntaxKind.ThisType);
ignoredTypes.add(typescript_1.SyntaxKind.UnknownKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.IndexedAccessType);
ignoredTypes.add(typescript_1.SyntaxKind.UndefinedKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.NeverKeyword);
ignoredTypes.add(typescript_1.SyntaxKind.TypeOperator);
ignoredTypes.add(typescript_1.SyntaxKind.NullKeyword);
function parseTVars(n) {
    return n.typeParameters ? n.typeParameters.map(function (p) { return p.name.text; }) : [];
}
/** Replace all occurrences of type variables with any  */
function eliminateTypeVars(ty, tVars) {
    switch (ty.category) {
        case "TVar":
            if (tVars.includes(ty.name)) {
                return exports.anyType;
            }
            else {
                return ty;
            }
        case "FuncType": {
            var newFrom = ty.args.map(function (t) { return eliminateTypeVars(t, tVars); });
            var newTo = eliminateTypeVars(ty.to, tVars);
            return new FuncType(newFrom, newTo);
        }
        case "ObjectType": {
            var nf = ty.fields.map(function (nv) { return new NamedValue(nv.name, eliminateTypeVars(nv.value, tVars)); });
            return new ObjectType(nf);
        }
        case "AnyType":
            return ty;
        default:
            throw new Error("Unknown category: " + JSON.stringify(ty));
    }
}
function parseSignatureType(sig) {
    var tVars = parseTVars(sig);
    var argTypes = sig.parameters.map(function (p) {
        return p.type ? eliminateTypeVars(parseTypeNode(mustExist(p.type)), tVars) : exports.anyType;
    });
    var retType = sig.type ? eliminateTypeVars(parseTypeNode(sig.type), tVars) : new TVar("void");
    return new FuncType(argTypes, retType);
}
function parseDeclarationName(n) {
    switch (n.kind) {
        case typescript_1.SyntaxKind.Identifier:
            return n.text;
        case typescript_1.SyntaxKind.StringLiteral:
            return n.text;
        case typescript_1.SyntaxKind.NumericLiteral:
            return n.text;
        default:
            return "UnhandledDeclarationName";
    }
}
function parseTypeMember(member) {
    if (member.name) {
        if (typescript_1.SyntaxKind.PropertyDeclaration == member.kind || typescript_1.SyntaxKind.PropertySignature == member.kind) {
            var x = member;
            return (new NamedValue(parseDeclarationName(x.name), x.type ? parseTypeNode(x.type) : exports.anyType));
        }
        else if (typescript_1.SyntaxKind.MethodSignature == member.kind || typescript_1.SyntaxKind.MethodDeclaration == member.kind) {
            var x = member;
            return (new NamedValue(parseDeclarationName(x.name), parseSignatureType(x)));
        }
        else {
            throw new Error("Unknown type member kind: " + typescript_1.SyntaxKind[member.kind]);
        }
    }
    else if ([typescript_1.SyntaxKind.IndexSignature, typescript_1.SyntaxKind.CallSignature,
        typescript_1.SyntaxKind.ConstructSignature].includes(member.kind)) {
        var sig = member;
        var methodName = sig.kind == typescript_1.SyntaxKind.IndexSignature ? "access"
            : (sig.kind == typescript_1.SyntaxKind.ConstructSignature ? "CONSTRUCTOR" : "call");
        return (new NamedValue(methodName, parseSignatureType(sig)));
    }
    else {
        throw new Error("Unknown type element: " + ts.SyntaxKind[member.kind]);
    }
}
function parseEntityName(n) {
    if (n.kind == typescript_1.SyntaxKind.Identifier) {
        return n.text;
    }
    else {
        return parseEntityName(n.left) + "." + n.right.text;
    }
}
function parseTypeNode(node) {
    if (node.kind == typescript_1.SyntaxKind.AnyKeyword || node.kind == typescript_1.SyntaxKind.ThisKeyword) {
        return exports.anyType;
    }
    else if (ts.isTypeReferenceNode(node)) {
        var n = node;
        return new TVar(parseEntityName(n.typeName));
    }
    else if (basicTypes.has(node.kind)) {
        return new TVar(basicTypes.get(node.kind));
    }
    else if (node.kind == typescript_1.SyntaxKind.ArrayType) {
        return new TVar("Array");
    }
    else if (node.kind == typescript_1.SyntaxKind.FunctionType || node.kind == typescript_1.SyntaxKind.ConstructorType) {
        var n = node;
        var ret = parseTypeNode(n.type);
        var args = n.parameters.map(function (p) {
            return p.type ? parseTypeNode(p.type) : exports.anyType;
        });
        return eliminateTypeVars(new FuncType(args, ret), parseTVars(n));
    }
    else if (node.kind == typescript_1.SyntaxKind.TypeLiteral) {
        var n = node;
        var members = n.members.map(parseTypeMember);
        return new ObjectType(members);
    }
    else if (node.kind == typescript_1.SyntaxKind.UnionType) {
        var n = node;
        if (n.types.length == 2) {
            var second = parseTypeNode(n.types[1]);
            if (second.category == "TVar" &&
                (second.name == "null" || second.name == "undefined")) {
                return parseTypeNode(n.types[0]);
            }
            else {
                return exports.anyType;
            }
        }
        return exports.anyType;
    }
    else if (ignoredTypes.has(node.kind)) {
        return exports.anyType;
    }
    else if (node.kind == typescript_1.SyntaxKind.LiteralType) {
        var n = node;
        switch (n.literal.kind) {
            case typescript_1.SyntaxKind.StringLiteral:
                return new TVar("string");
            case typescript_1.SyntaxKind.TrueKeyword:
            case typescript_1.SyntaxKind.FalseKeyword:
                return new TVar("boolean");
            case typescript_1.SyntaxKind.NumericLiteral:
                return new TVar("number");
            default:
                return exports.anyType;
        }
    }
    else if (node.kind == typescript_1.SyntaxKind.IntersectionType) {
        return exports.anyType;
    }
    else if (node.kind == typescript_1.SyntaxKind.ParenthesizedType) {
        var n = node;
        return parseTypeNode(n.type);
    }
    else if (node.kind == typescript_1.SyntaxKind.FirstTypeNode || node.kind == typescript_1.SyntaxKind.LastTypeNode) {
        return new TVar("boolean");
    }
    else if (node.kind == typescript_1.SyntaxKind.TupleType) {
        return new TVar("Array");
    }
    else if (node.kind == typescript_1.SyntaxKind.TypeQuery) {
        return exports.anyType; // fixme: handle type query
    }
    else {
        throw new Error("Unknown Type Kind: " + ts.SyntaxKind[node.kind]);
    }
}
var NamedValue = /** @class */ (function () {
    function NamedValue(name, value) {
        this.name = name;
        this.value = value;
    }
    return NamedValue;
}());
var Var = /** @class */ (function () {
    function Var(name) {
        this.name = name;
        this.category = "Var";
        this.mark = "missing";
        mustExist(name);
    }
    return Var;
}());
var Const = /** @class */ (function () {
    function Const(value, ty, line) {
        this.value = value;
        this.ty = ty;
        this.line = line;
        this.category = "Const";
        mustExist(value);
        this.mark = new Inferred(ty);
    }
    return Const;
}());
var Cast = /** @class */ (function () {
    function Cast(expr, ty) {
        this.expr = expr;
        this.ty = ty;
        this.category = "Cast";
        mustExist(expr);
        this.mark = new Inferred(ty);
    }
    return Cast;
}());
var FuncCall = /** @class */ (function () {
    function FuncCall(f, args, mark) {
        this.f = f;
        this.args = args;
        this.mark = mark;
        this.category = "FuncCall";
    }
    return FuncCall;
}());
var ObjLiteral = /** @class */ (function () {
    function ObjLiteral(fields, mark) {
        this.fields = fields;
        this.mark = mark;
        this.category = "ObjLiteral";
    }
    return ObjLiteral;
}());
var Access = /** @class */ (function () {
    function Access(expr, field, mark) {
        this.expr = expr;
        this.field = field;
        this.mark = mark;
        this.category = "Access";
        mustExist(field);
    }
    return Access;
}());
var IfExpr = /** @class */ (function () {
    function IfExpr(cond, e1, e2, mark) {
        this.cond = cond;
        this.e1 = e1;
        this.e2 = e2;
        this.mark = mark;
        this.category = "IfExpr";
    }
    return IfExpr;
}());
var VarDef = /** @class */ (function () {
    function VarDef(x, mark, init, isConst, modifiers, srcSpan) {
        this.x = x;
        this.mark = mark;
        this.init = init;
        this.isConst = isConst;
        this.modifiers = modifiers;
        this.srcSpan = srcSpan;
        this.category = "VarDef";
        mustExist(x);
    }
    return VarDef;
}());
var AssignStmt = /** @class */ (function () {
    function AssignStmt(lhs, rhs) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.category = "AssignStmt";
    }
    return AssignStmt;
}());
var ExprStmt = /** @class */ (function () {
    function ExprStmt(expr, isReturn) {
        this.expr = expr;
        this.isReturn = isReturn;
        this.category = "ExprStmt";
    }
    return ExprStmt;
}());
var IfStmt = /** @class */ (function () {
    function IfStmt(cond, branch1, branch2) {
        this.cond = cond;
        this.branch1 = branch1;
        this.branch2 = branch2;
        this.category = "IfStmt";
    }
    return IfStmt;
}());
var WhileStmt = /** @class */ (function () {
    function WhileStmt(cond, body) {
        this.cond = cond;
        this.body = body;
        this.category = "WhileStmt";
    }
    return WhileStmt;
}());
var ImportSingle = /** @class */ (function () {
    function ImportSingle(oldName, newName, path) {
        this.oldName = oldName;
        this.newName = newName;
        this.path = path;
        this.category = "ImportSingle";
    }
    return ImportSingle;
}());
var ImportDefault = /** @class */ (function () {
    function ImportDefault(newName, path) {
        this.newName = newName;
        this.path = path;
        this.category = "ImportDefault";
    }
    return ImportDefault;
}());
var ImportModule = /** @class */ (function () {
    function ImportModule(newName, path) {
        this.newName = newName;
        this.path = path;
        this.category = "ImportModule";
    }
    return ImportModule;
}());
var ExportSingle = /** @class */ (function () {
    function ExportSingle(oldName, newName, from) {
        this.oldName = oldName;
        this.newName = newName;
        this.from = from;
        this.category = "ExportSingle";
    }
    return ExportSingle;
}());
var ExportDefault = /** @class */ (function () {
    function ExportDefault(newName, from) {
        this.newName = newName;
        this.from = from;
        this.category = "ExportDefault";
    }
    return ExportDefault;
}());
var ExportModule = /** @class */ (function () {
    function ExportModule(from) {
        this.from = from;
        this.category = "ExportModule";
    }
    return ExportModule;
}());
var NamespaceAliasStmt = /** @class */ (function () {
    function NamespaceAliasStmt(name, rhs) {
        this.name = name;
        this.rhs = rhs;
        this.category = "NamespaceAliasStmt";
    }
    return NamespaceAliasStmt;
}());
var TypeAliasStmt = /** @class */ (function () {
    function TypeAliasStmt(name, tyVars, type, modifiers, superTypes) {
        this.name = name;
        this.tyVars = tyVars;
        this.type = type;
        this.modifiers = modifiers;
        this.superTypes = superTypes;
        this.category = "TypeAliasStmt";
        mustExist(name);
        mustExist(tyVars);
        mustExist(type);
        mustExist(modifiers);
    }
    return TypeAliasStmt;
}());
var CommentStmt = /** @class */ (function () {
    function CommentStmt(text) {
        this.text = text;
        this.category = "CommentStmt";
        mustExist(text);
    }
    return CommentStmt;
}());
var BlockStmt = /** @class */ (function () {
    function BlockStmt(stmts) {
        this.stmts = stmts;
        this.category = "BlockStmt";
    }
    return BlockStmt;
}());
var NamespaceStmt = /** @class */ (function () {
    function NamespaceStmt(name, block, modifiers) {
        this.name = name;
        this.block = block;
        this.modifiers = modifiers;
        this.category = "NamespaceStmt";
    }
    return NamespaceStmt;
}());
var FuncDef = /** @class */ (function () {
    function FuncDef(name, args, returnType, body, modifiers, tyVars) {
        this.name = name;
        this.args = args;
        this.returnType = returnType;
        this.body = body;
        this.modifiers = modifiers;
        this.tyVars = tyVars;
        this.category = "FuncDef";
        mustExist(name);
    }
    return FuncDef;
}());
var Constructor = /** @class */ (function (_super) {
    __extends(Constructor, _super);
    function Constructor(name, args, returnType, body, modifiers, tyVars, publicVars) {
        var _this = _super.call(this, name, args, [returnType, null], body, modifiers, tyVars) || this;
        _this.publicVars = publicVars;
        mustExist(publicVars);
        return _this;
    }
    return Constructor;
}(FuncDef));
var ClassDef = /** @class */ (function () {
    function ClassDef(name, constr, instanceLambdas, staticLambdas, vars, funcDefs, superTypes, modifiers, tyVars) {
        this.name = name;
        this.constr = constr;
        this.instanceLambdas = instanceLambdas;
        this.staticLambdas = staticLambdas;
        this.vars = vars;
        this.funcDefs = funcDefs;
        this.superTypes = superTypes;
        this.modifiers = modifiers;
        this.tyVars = tyVars;
        this.category = "ClassDef";
    }
    return ClassDef;
}());
function parseExpr(node, allocateLambda, checker) {
    function rec(node) {
        var n = node;
        mustExist(n);
        function infer() {
            return parseGMark(undefined, node, checker);
        }
        switch (n.kind) {
            case typescript_1.SyntaxKind.Identifier: {
                var name = n.text;
                return new Var(name);
            }
            case typescript_1.SyntaxKind.ThisKeyword:
                return SpecialVars.THIS;
            case typescript_1.SyntaxKind.SuperKeyword:
                return SpecialVars.SUPER;
            case typescript_1.SyntaxKind.CallExpression: {
                var f = rec(n.expression);
                var args = n.arguments.map(rec);
                return new FuncCall(f, args, infer());
            }
            case typescript_1.SyntaxKind.NewExpression: {
                var args = n.arguments ? n.arguments.map(rec) : [];
                var f = new Access(rec(n.expression), "CONSTRUCTOR", "missing");
                return new FuncCall(f, args, infer());
            }
            case typescript_1.SyntaxKind.ObjectLiteralExpression: {
                var fields = flatMap(n.properties, function (p) {
                    if (p.kind == typescript_1.SyntaxKind.PropertyAssignment ||
                        p.kind == typescript_1.SyntaxKind.ShorthandPropertyAssignment) {
                        return [parseObjectLiteralElementLike(p)];
                    }
                    else {
                        return []; //todo: other cases
                    }
                });
                return new ObjLiteral(fields, infer());
            }
            case typescript_1.SyntaxKind.PropertyAccessExpression: {
                var lhs = rec(n.expression);
                return new Access(lhs, n.name.text, infer());
            }
            case ts.SyntaxKind.ElementAccessExpression: {
                var thing = rec(n.expression);
                var index = rec(n.argumentExpression);
                return new FuncCall(new Access(thing, "access", "missing"), [index], infer());
            }
            case ts.SyntaxKind.ConditionalExpression: {
                var cond = rec(n.condition);
                var e1 = rec(n.whenTrue);
                var e2 = rec(n.whenFalse);
                return new IfExpr(cond, e1, e2, infer());
            }
            case ts.SyntaxKind.ParenthesizedExpression: {
                return rec(n.expression);
            }
            // constants
            case typescript_1.SyntaxKind.NumericLiteral:
                return constExpr("number");
            case typescript_1.SyntaxKind.StringLiteral:
                return constExpr("string");
            case typescript_1.SyntaxKind.RegularExpressionLiteral:
                return constExpr("RegExp");
            case typescript_1.SyntaxKind.TrueKeyword:
            case typescript_1.SyntaxKind.FalseKeyword:
                return constExpr("boolean");
            case typescript_1.SyntaxKind.NullKeyword:
                return constExpr(exports.anyType.name, "null");
            case typescript_1.SyntaxKind.VoidExpression: {
                return constExpr("void", "void");
            }
            case typescript_1.SyntaxKind.ArrayLiteralExpression: {
                var a = node;
                var exs = a.elements.map(rec);
                return new FuncCall(new Var("Array"), exs, infer());
            }
            // operators
            case ts.SyntaxKind.BinaryExpression: {
                var l = rec(n.left);
                var r = rec(n.right);
                var opp = n.operatorToken.kind;
                return new FuncCall(new Var(ts.SyntaxKind[opp]), [l, r], infer());
            }
            case typescript_1.SyntaxKind.PrefixUnaryExpression:
            case typescript_1.SyntaxKind.PostfixUnaryExpression: {
                var opName = ts.SyntaxKind[n["operator"]];
                var fixity = (node.kind == typescript_1.SyntaxKind.PrefixUnaryExpression) ? "" : "POST_";
                var arg = rec(n["operand"]);
                return new FuncCall(new Var(fixity + opName), [arg], infer());
            }
            case typescript_1.SyntaxKind.ArrowFunction:
            case typescript_1.SyntaxKind.FunctionExpression: {
                try {
                    return allocateLambda(n);
                }
                catch (e) {
                    return exports.undefinedValue;
                }
            }
            // Special treatments:
            case typescript_1.SyntaxKind.SpreadElement: {
                var n1 = n.expression;
                return new FuncCall(SpecialVars.spread, [rec(n1)], infer());
            }
            case typescript_1.SyntaxKind.TypeOfExpression: {
                return new FuncCall(SpecialVars.typeOf, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.TaggedTemplateExpression: {
                var tagE = rec(n.tag);
                var temp = rec(n.template);
                return new FuncCall(tagE, [temp], infer());
            }
            case typescript_1.SyntaxKind.TemplateExpression: {
                var spans = n.templateSpans.map(function (sp) { return rec(sp.expression); });
                return new FuncCall(SpecialVars.Template, spans, infer());
            }
            case typescript_1.SyntaxKind.NoSubstitutionTemplateLiteral:
                return constExpr("string");
            case typescript_1.SyntaxKind.DeleteExpression: {
                return new FuncCall(SpecialVars.DELETE, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.YieldExpression: {
                return new FuncCall(SpecialVars.YIELD, [rec(mustExist(n.expression))], infer());
            }
            case typescript_1.SyntaxKind.AwaitExpression: {
                return new FuncCall(SpecialVars.AWAIT, [rec(n.expression)], infer());
            }
            case typescript_1.SyntaxKind.NonNullExpression: {
                return rec(n.expression);
            }
            case typescript_1.SyntaxKind.JsxElement:
            case typescript_1.SyntaxKind.JsxSelfClosingElement: {
                return exports.undefinedValue;
            }
            case typescript_1.SyntaxKind.TypeAssertionExpression:
            case typescript_1.SyntaxKind.AsExpression: {
                var e = rec(n.expression);
                var t = parseTypeNode(n.type);
                return new Cast(e, t);
            }
            // type assertions are ignored
            case typescript_1.SyntaxKind.OmittedExpression:
            case typescript_1.SyntaxKind.ImportKeyword:
            case typescript_1.SyntaxKind.MetaProperty:
            case typescript_1.SyntaxKind.ClassExpression: {
                return exports.undefinedValue; //todo: properly handle
            }
            default: {
                throw new Error("Unknown expression category: " + ts.SyntaxKind[node.kind]
                    + ". Text: " + node.getText());
            }
        }
        function constExpr(typeName, value) {
            // let v = (<ts.LiteralLikeNode>node).text;
            var v = value ? value : "???";
            return new Const(v, new TVar(typeName), getLineNumber(n));
        }
        function parseObjectLiteralElementLike(p) {
            //todo: properly handle other cases like accessors
            var fieldName = p.name.getText();
            var rhs = (p.kind == typescript_1.SyntaxKind.PropertyAssignment) ? rec(p.initializer) : new Var(fieldName);
            return new NamedValue(fieldName, rhs);
        }
    }
    return rec(node);
}
exports.parseExpr = parseExpr;
exports.undefinedValue = new Var("undefined");
function parseGMark(tyNode, node, checker) {
    if (!tyNode) {
        if (node) {
            var ty = checker.getTypeAtLocation(node);
            var n = checker.typeToTypeNode(ty);
            var t = n ? parseTypeNode(n) : exports.anyType;
            if (t.category == "AnyType") {
                return "missing";
            }
            else {
                return new Inferred(t);
            }
        }
        else {
            return "missing";
        }
    }
    else {
        return new UserAnnot(parseTypeNode(tyNode));
    }
}
exports.parseGMark = parseGMark;
var StmtParser = /** @class */ (function () {
    function StmtParser(checker) {
        this.checker = checker;
        this.nLambda = [0];
    }
    StmtParser.prototype.parseStmt = function (node) {
        var checker = this.checker;
        function parseMark(tyNode, node) {
            return parseGMark(tyNode, node, checker);
        }
        var getNLambda = this.nLambda;
        var StmtsHolder = /** @class */ (function () {
            function StmtsHolder(stmts) {
                this.stmts = stmts;
            }
            return StmtsHolder;
        }());
        var ExprProcessor = /** @class */ (function () {
            function ExprProcessor() {
                this.lambdaDefs = [];
            }
            ExprProcessor.prototype.processExpr = function (e) {
                var lambdas = this.lambdaDefs;
                function allocateLambda(f) {
                    var n0 = f.name;
                    var name;
                    if (n0) {
                        name = n0.getText();
                    }
                    else {
                        name = "$Lambda" + getNLambda[0];
                        getNLambda[0] += 1;
                    }
                    var srcSpan = n0 ? getSrcSpan(n0) : null;
                    lambdas.push(parseFunction(name, f, parseModifiers(f.modifiers), srcSpan));
                    return new Var(name);
                }
                return parseExpr(e, allocateLambda, checker);
            };
            ExprProcessor.prototype.alongWith = function () {
                var stmts = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    stmts[_i] = arguments[_i];
                }
                return new StmtsHolder(this.lambdaDefs.concat(stmts));
            };
            ExprProcessor.prototype.alongWithMany = function (stmts) {
                return new StmtsHolder(this.lambdaDefs.concat(stmts));
            };
            return ExprProcessor;
        }());
        /**
         * returns the parsed FuncDef along with arguments that are marked
         * with 'public' (for constructors)
         */
        function parseFunction(name, n, modifiers, returnSrcSpan) {
            function inferRetType() {
                if (n.type) {
                    return parseMark(n.type, undefined);
                }
                var tNode = checker.typeToTypeNode(checker.getTypeAtLocation(n));
                if (tNode) {
                    var t = parseTypeNode(tNode);
                    if (t.category == "FuncType") {
                        return new Inferred(t.to);
                    }
                }
                return "missing";
            }
            var isConstructor = ts.isConstructorDeclaration(n);
            var retType = inferRetType();
            var publicArgs = [];
            var bindingInArgs = false;
            var args = n.parameters.map(function (p) {
                var name;
                if (p.name.kind == typescript_1.SyntaxKind.Identifier) {
                    name = p.name.text;
                }
                else {
                    name = "_";
                    bindingInArgs = true;
                }
                if (parseModifiers(p.modifiers).includes("public")) {
                    publicArgs.push(name);
                }
                return new NamedValue(name, [parseMark(p.type, undefined), getSrcSpan(p.name)]);
            });
            var body;
            if (n.kind != typescript_1.SyntaxKind.IndexSignature && n.body && !bindingInArgs) {
                if (n.body.kind == typescript_1.SyntaxKind.Block) {
                    body = rec(n.body);
                }
                else {
                    var ep = new ExprProcessor();
                    // try to parse the body as a ConciseFunction body
                    body = ep.alongWith(new ExprStmt(ep.processExpr(n.body), true));
                }
            }
            else {
                body = new ExprProcessor().alongWithMany([]);
            }
            var type_params = n.typeParameters;
            var t_vars;
            if (type_params) {
                t_vars = type_params.map(function (n) { return n.name.text; });
            }
            else {
                t_vars = [];
            }
            return isConstructor ?
                new Constructor(name, args, retType, flattenBlock(body.stmts), modifiers, t_vars, publicArgs) :
                new FuncDef(name, args, [retType, returnSrcSpan], flattenBlock(body.stmts), modifiers, t_vars);
        }
        function rec(node) {
            return handleError(node, function () {
                mustExist(node);
                var EP = new ExprProcessor();
                function parseVarDecList(node, modifiers, rhs) {
                    return handleError(node, function () {
                        var isConst = (node.flags & ts.NodeFlags.Const) != 0;
                        function parseVarDec(dec, rhs) {
                            var rhs1 = rhs ? rhs : (dec.initializer ? EP.processExpr(dec.initializer) : null);
                            return parseBindingName(dec.name, rhs1, dec.type);
                        }
                        function parseBindingName(lhs, rhs, ty) {
                            switch (lhs.kind) {
                                case typescript_1.SyntaxKind.Identifier:
                                    var vd = new VarDef(lhs.text, parseMark(ty, lhs), rhs, isConst, modifiers, getSrcSpan(lhs));
                                    return [vd];
                                case typescript_1.SyntaxKind.ObjectBindingPattern:
                                    return flatMap(lhs.elements, function (e) {
                                        var fieldName = e.propertyName ? e.propertyName : e.name;
                                        var fName;
                                        switch (fieldName.kind) {
                                            case typescript_1.SyntaxKind.Identifier:
                                            case typescript_1.SyntaxKind.StringLiteral:
                                            case typescript_1.SyntaxKind.ComputedPropertyName:
                                            case typescript_1.SyntaxKind.NumericLiteral:
                                                fName = parsePropertyName(fieldName);
                                                break;
                                            default:
                                                fName = SpecialVars.UNKNOWN;
                                                break;
                                        }
                                        var access = rhs ? new Access(rhs, fName, "missing") : null;
                                        return parseBindingName(e.name, access);
                                    });
                                case typescript_1.SyntaxKind.ArrayBindingPattern: {
                                    var arrayAccessed_1 = rhs ? new FuncCall(SpecialVars.ArrayAccess, [rhs], "missing") : null;
                                    return flatMap(lhs.elements, function (e) {
                                        if (e.kind == typescript_1.SyntaxKind.OmittedExpression) {
                                            return [];
                                        }
                                        else {
                                            return parseBindingName(e.name, arrayAccessed_1);
                                        }
                                    });
                                }
                            }
                        }
                        var dec = node.declarations;
                        return flatMap(dec, function (x) { return parseVarDec(x, rhs); });
                    });
                }
                function isStatic(n) {
                    return parseModifiers(n.modifiers).includes("static");
                }
                switch (node.kind) {
                    case typescript_1.SyntaxKind.ThrowStatement:
                    case typescript_1.SyntaxKind.ExpressionStatement: {
                        var n = node;
                        if (n.expression.kind == typescript_1.SyntaxKind.BinaryExpression) {
                            var e = n.expression;
                            if (e.operatorToken.kind == ts.SyntaxKind.FirstAssignment) {
                                var l = EP.processExpr(e.left);
                                var r = EP.processExpr(e.right);
                                return EP.alongWith(new AssignStmt(l, r));
                            }
                        }
                        var shouldReturn = n.expression.kind == typescript_1.SyntaxKind.YieldExpression;
                        return EP.alongWith(new ExprStmt(EP.processExpr(n.expression), shouldReturn));
                    }
                    case typescript_1.SyntaxKind.ReturnStatement: {
                        var n = node;
                        return n.expression ?
                            EP.alongWith(new ExprStmt(EP.processExpr(n.expression), true))
                            : EP.alongWith(new CommentStmt("return;"));
                    }
                    case typescript_1.SyntaxKind.VariableStatement: {
                        var n = node;
                        var ms = parseModifiers(n.modifiers);
                        var list = n.declarationList;
                        return EP.alongWithMany(parseVarDecList(list, ms));
                    }
                    case typescript_1.SyntaxKind.IfStatement: {
                        var n = node;
                        var cond = EP.processExpr(n.expression);
                        var then = flattenBlock(rec(n.thenStatement).stmts);
                        var otherwise = void 0;
                        if (n.elseStatement == undefined) {
                            otherwise = [new BlockStmt([])];
                        }
                        else {
                            otherwise = rec(n.elseStatement).stmts;
                        }
                        return EP.alongWith(new IfStmt(cond, then, flattenBlock(otherwise)));
                    }
                    case typescript_1.SyntaxKind.DoStatement: // simply treat do as while
                    case typescript_1.SyntaxKind.WhileStatement: {
                        var n = node;
                        var cond = EP.processExpr(n.expression);
                        var body = flattenBlock(rec(n.statement).stmts);
                        return EP.alongWith(new WhileStmt(cond, body));
                    }
                    case typescript_1.SyntaxKind.Block: {
                        var n = node;
                        var stmts = flatMap(n.statements, function (x) { return rec(x).stmts; });
                        return EP.alongWith(new BlockStmt(stmts));
                    }
                    case typescript_1.SyntaxKind.ForOfStatement:
                    case typescript_1.SyntaxKind.ForInStatement:
                    case typescript_1.SyntaxKind.ForStatement: {
                        var n = node;
                        var cond = new Const("true", new TVar("boolean"), getLineNumber(n));
                        var incr = [];
                        var expression = undefined;
                        if (n.kind == typescript_1.SyntaxKind.ForStatement) {
                            if (n.condition) {
                                cond = EP.processExpr(n.condition);
                            }
                            if (n.incrementor) {
                                incr = [new ExprStmt(EP.processExpr(n.incrementor), false)];
                            }
                        }
                        else {
                            var rhs = EP.processExpr(n.expression);
                            expression = new FuncCall(SpecialVars.ArrayAccess, [rhs], "missing");
                        }
                        var init = n.initializer;
                        var outerBlock = new BlockStmt([]);
                        if (init && ts.isVariableDeclarationList(init)) {
                            outerBlock.stmts = parseVarDecList(init, [], expression);
                        }
                        else if (init) {
                            outerBlock.stmts.push(new ExprStmt(EP.processExpr(init), false));
                        }
                        var bodyStmts = rec(n.statement).stmts.concat(incr);
                        outerBlock.stmts.push(new WhileStmt(cond, flattenBlock(bodyStmts)));
                        return EP.alongWith(outerBlock);
                    }
                    case typescript_1.SyntaxKind.FunctionDeclaration:
                    case typescript_1.SyntaxKind.MethodDeclaration:
                    case typescript_1.SyntaxKind.GetAccessor:
                    case typescript_1.SyntaxKind.SetAccessor:
                    case typescript_1.SyntaxKind.Constructor: {
                        var name = (node.kind == typescript_1.SyntaxKind.Constructor) ? "Constructor" :
                            useOrElse(node.name, function (x) { return parsePropertyName(x); }, "defaultFunc");
                        var n = node;
                        var modifiers = parseModifiers(n.modifiers);
                        if (node.kind == typescript_1.SyntaxKind.SetAccessor) {
                            modifiers.push("set");
                        }
                        else if (node.kind == typescript_1.SyntaxKind.GetAccessor) {
                            modifiers.push("get");
                        }
                        var srcSpan = n.name ? getSrcSpan(n.name) : null;
                        return EP.alongWith(parseFunction(name, n, modifiers, srcSpan));
                    }
                    case typescript_1.SyntaxKind.ClassDeclaration: {
                        var n = node;
                        var name = n.name ? n.name.text : "DefaultClass";
                        var superTypes = [];
                        if (n.heritageClauses) {
                            var clauses = n.heritageClauses;
                            for (var _i = 0, clauses_1 = clauses; _i < clauses_1.length; _i++) {
                                var c = clauses_1[_i];
                                superTypes.push(c.types[0].expression.getText());
                            }
                        }
                        var vars_1 = [];
                        var funcDefs = [];
                        var constructor = null;
                        // let isAbstract = n.modifiers && n.modifiers.map(x => x.kind).includes(SyntaxKind.AbstractKeyword);
                        var instanceEp = new ExprProcessor();
                        var staticEp = new ExprProcessor();
                        var _loop_1 = function (v) {
                            var staticQ = isStatic(v);
                            var ep = staticQ ? staticEp : instanceEp;
                            if (ts.isPropertyDeclaration(v)) {
                                var v1 = v;
                                var init = v1.initializer ? ep.processExpr(v1.initializer) : null;
                                vars_1.push(new NamedValue(parsePropertyName(v1.name), [parseMark(v1.type, v1), init, staticQ, getSrcSpan(v1.name)]));
                            }
                            else if (ts.isMethodDeclaration(v) || ts.isAccessor(v)) {
                                funcDefs.push([getSingleton(rec(v).stmts), staticQ]);
                            }
                            else if (ts.isConstructorDeclaration(v)) {
                                var c_1 = getSingleton(rec(v).stmts);
                                c_1.args
                                    .filter(function (v) { return c_1.publicVars.includes(v.name); })
                                    .forEach(function (p) { return vars_1.push(new NamedValue(p.name, [p.value[0], null, false, p.value[1]])); });
                                constructor = c_1;
                            }
                            else if (ts.isIndexSignatureDeclaration(v)) {
                                var n_1 = v;
                                var srcSpan = n_1.type ? getSrcSpan(n_1.type) : null;
                                parseFunction("access", n_1, parseModifiers(n_1.modifiers), srcSpan);
                            }
                            else if (ts.isSemicolonClassElement(v)) {
                                // ignore
                            }
                            else {
                                throw new Error("Unknown statements in class definitions: " + typescript_1.SyntaxKind[v.kind]);
                            }
                        };
                        for (var _a = 0, _b = n.members; _a < _b.length; _a++) {
                            var v = _b[_a];
                            _loop_1(v);
                        }
                        var classModifiers = parseModifiers(n.modifiers);
                        var tVars = parseTVars(n);
                        var classStmt = new ClassDef(name, constructor, instanceEp.lambdaDefs, staticEp.lambdaDefs, vars_1, funcDefs, superTypes, classModifiers, tVars);
                        return EP.alongWith(classStmt);
                    }
                    case typescript_1.SyntaxKind.SwitchStatement: {
                        var n = node;
                        var switchCall = new FuncCall(SpecialVars.SWITCH, [EP.processExpr(n.expression)], "missing");
                        var clauses = flatMap(n.caseBlock.clauses, function (c) {
                            var body = flatMap(c.statements, function (s) { return rec(s).stmts; });
                            switch (c.kind) {
                                case typescript_1.SyntaxKind.CaseClause:
                                    var f = new FuncCall(SpecialVars.CASE, [EP.processExpr(c.expression)], "missing");
                                    var all = [new ExprStmt(f, false)].concat(body);
                                    return EP.alongWithMany(all).stmts;
                                case typescript_1.SyntaxKind.DefaultClause:
                                    return EP.alongWithMany(body).stmts;
                            }
                        });
                        return EP.alongWithMany([new ExprStmt(switchCall, false)].concat(clauses));
                    }
                    case typescript_1.SyntaxKind.ImportEqualsDeclaration: {
                        var n = node;
                        var rhs = n.moduleReference;
                        if (rhs.kind == typescript_1.SyntaxKind.ExternalModuleReference) {
                            var newName = n.name.text;
                            if (rhs.expression.kind == typescript_1.SyntaxKind.StringLiteral) {
                                var path = rhs.expression.text;
                                return EP.alongWith(new ImportSingle("$ExportEquals", newName, path));
                            }
                            else {
                                throw new Error("Unknown import equals: " + n.getText());
                            }
                        }
                        else {
                            return EP.alongWith(new NamespaceAliasStmt(n.name.getText(), rhs.getText()));
                        }
                    }
                    case typescript_1.SyntaxKind.ImportDeclaration: {
                        var n = node;
                        var path_1 = n.moduleSpecifier.text;
                        if (n.importClause) {
                            if (n.importClause.name) {
                                return EP.alongWith(new ImportDefault(n.importClause.name.text, path_1));
                            }
                            if (n.importClause.namedBindings) {
                                var bindings = n.importClause.namedBindings;
                                if (bindings.kind == typescript_1.SyntaxKind.NamespaceImport) {
                                    return EP.alongWith(new ImportModule(bindings.name.text, path_1));
                                }
                                else {
                                    var imports = bindings.elements.map(function (s) {
                                        var newName = s.name.text;
                                        if (s.propertyName) {
                                            return new ImportSingle(s.propertyName.text, newName, path_1);
                                        }
                                        else {
                                            return new ImportSingle(newName, newName, path_1);
                                        }
                                    });
                                    return EP.alongWithMany(imports);
                                }
                            }
                        }
                        return EP.alongWith();
                    }
                    case typescript_1.SyntaxKind.ExportAssignment: {
                        var n = node;
                        var e = EP.processExpr(n.expression);
                        if (n.isExportEquals == true) {
                            var alias = new NamespaceAliasStmt("$ExportEquals", n.expression.getText());
                            return EP.alongWith(alias);
                            // return EP.alongWith(new VarDef("$ExportEquals", null, e, true,
                            //   ["export"]));
                        }
                        else if (e.category == "Var") {
                            return EP.alongWith(new ExportDefault(e.name, null));
                        }
                        else {
                            return EP.alongWith(new VarDef("defaultVar", parseMark(undefined, n.expression), e, true, ["export", "default"], null));
                        }
                    }
                    case typescript_1.SyntaxKind.NamespaceExportDeclaration: {
                        var n = node;
                        //todo: check if this is the right way
                        var name = n.name.text;
                        return EP.alongWith(new ExportSingle(name, name, null));
                    }
                    case typescript_1.SyntaxKind.ExportDeclaration: {
                        var n = node;
                        var path_2 = n.moduleSpecifier ? n.moduleSpecifier.text : null;
                        if (n.exportClause) {
                            var clause = n.exportClause;
                            var exports_1 = clause.elements.map(function (s) {
                                var newName = s.name.text;
                                if (s.propertyName) {
                                    return new ExportSingle(s.propertyName.text, newName, path_2);
                                }
                                else {
                                    return new ExportSingle(newName, newName, path_2);
                                }
                            });
                            return EP.alongWithMany(exports_1);
                        }
                        else {
                            return EP.alongWith(new ExportModule(path_2));
                        }
                    }
                    case typescript_1.SyntaxKind.EnumDeclaration: {
                        var enumEquiv_1 = new TVar("number");
                        var n_2 = node;
                        var vars = n_2.members.map(function (member) {
                            var vName = member.name.getText();
                            return new NamedValue(vName, new Const("ENUM", enumEquiv_1, getLineNumber(n_2)));
                        });
                        var rhs = new ObjLiteral(vars, "missing");
                        var mds = parseModifiers(n_2.modifiers);
                        return EP.alongWithMany([
                            new VarDef(n_2.name.text, "missing", rhs, true, mds, getSrcSpan(n_2.name)),
                            new TypeAliasStmt(n_2.name.text, [], enumEquiv_1, mds, [])
                        ]);
                    }
                    case typescript_1.SyntaxKind.InterfaceDeclaration: {
                        var n = node;
                        var superTypes = [];
                        if (n.heritageClauses) {
                            var clauses = n.heritageClauses;
                            for (var _c = 0, clauses_2 = clauses; _c < clauses_2.length; _c++) {
                                var c = clauses_2[_c];
                                superTypes.push(c.types[0].expression.getText());
                            }
                        }
                        var tVars = parseTVars(n);
                        var members = n.members.map(parseTypeMember);
                        var objT = new ObjectType(members);
                        return EP.alongWith(new TypeAliasStmt(n.name.text, tVars, objT, parseModifiers(n.modifiers), superTypes));
                    }
                    case typescript_1.SyntaxKind.TypeAliasDeclaration: {
                        var n = node;
                        var tVars = parseTVars(n);
                        return EP.alongWith(new TypeAliasStmt(n.name.text, tVars, parseTypeNode(n.type), parseModifiers(n.modifiers), []));
                    }
                    case typescript_1.SyntaxKind.TryStatement: {
                        var n = node;
                        var tryPart = rec(n.tryBlock).stmts;
                        var finallyPart = n.finallyBlock ? rec(n.finallyBlock).stmts : [];
                        return EP.alongWithMany(tryPart.concat(finallyPart));
                    }
                    case typescript_1.SyntaxKind.ModuleDeclaration: {
                        var n = node;
                        var name = n.name.text;
                        var body = n.body;
                        if (body) {
                            switch (body.kind) {
                                case ts.SyntaxKind.ModuleBlock: {
                                    var stmts = flatMap(body.statements, function (x) { return rec(x).stmts; });
                                    var modifiers = parseModifiers(n.modifiers);
                                    var r = new NamespaceStmt(name, new BlockStmt(stmts), modifiers);
                                    return EP.alongWith(r);
                                }
                                case ts.SyntaxKind.ModuleDeclaration: {
                                    var modifiers = parseModifiers(n.modifiers);
                                    var r = new NamespaceStmt(name, new BlockStmt(rec(body).stmts), modifiers);
                                    return EP.alongWith(r);
                                }
                                default:
                                    throw new Error("Module declare body? Text: \n" + body.getText());
                            }
                        }
                        return EP.alongWith();
                    }
                    case typescript_1.SyntaxKind.LabeledStatement: {
                        var n = node;
                        return rec(n.statement);
                    }
                    // ignored statements:
                    case typescript_1.SyntaxKind.DebuggerStatement:
                    case typescript_1.SyntaxKind.BreakStatement:
                    case typescript_1.SyntaxKind.ContinueStatement:
                        return EP.alongWith(new CommentStmt(node.getText()));
                    case typescript_1.SyntaxKind.EmptyStatement:
                        return EP.alongWithMany([]);
                    default:
                        throw new Error("Unknown stmt category: " + ts.SyntaxKind[node.kind]);
                }
            });
        }
        function parsePropertyName(name) {
            switch (name.kind) {
                case ts.SyntaxKind.Identifier:
                    return name.text;
                case ts.SyntaxKind.ComputedPropertyName:
                    return SpecialVars.ComputedPropertyName;
                case ts.SyntaxKind.NumericLiteral:
                    return name.getText();
                case ts.SyntaxKind.StringLiteral:
                    return name.text;
            }
        }
        return rec(node).stmts;
    };
    return StmtParser;
}());
exports.StmtParser = StmtParser;
function parseModifiers(modifiersNode) {
    if (modifiersNode) {
        return flatMap(modifiersNode, function (m) {
            switch (m.kind) {
                case typescript_1.SyntaxKind.ExportKeyword:
                    return ["export"];
                case typescript_1.SyntaxKind.DefaultKeyword:
                    return ["default"];
                case typescript_1.SyntaxKind.ConstKeyword:
                    return ["const"];
                case typescript_1.SyntaxKind.StaticKeyword:
                    return ["static"];
                case typescript_1.SyntaxKind.PublicKeyword:
                    return ["public"];
                case typescript_1.SyntaxKind.AsyncKeyword:
                    return ["async"];
                default:
                    return [];
            }
        });
    }
    return [];
}
function flattenBlock(stmts) {
    if (stmts.length == 1) {
        return stmts[0];
    }
    else {
        return new BlockStmt(stmts);
    }
}
exports.flattenBlock = flattenBlock;
function getSingleton(xs) {
    if (xs.length != 1) {
        throw new Error("Expect a singleton collection, but get: " + xs);
    }
    return xs[0];
}
exports.getSingleton = getSingleton;
var SpecialVars = /** @class */ (function () {
    function SpecialVars() {
    }
    SpecialVars.spread = new Var("$Spread");
    SpecialVars.typeOf = new Var("$TypeOf");
    SpecialVars.THIS = new Var("this");
    SpecialVars.SUPER = new Var("super");
    SpecialVars.CASE = new Var("$Case");
    SpecialVars.SWITCH = new Var("$Switch");
    SpecialVars.DELETE = new Var("$Delete");
    SpecialVars.ArrayAccess = new Var("$ArrayAccess");
    SpecialVars.YIELD = new Var("$Yield");
    SpecialVars.AWAIT = new Var("$Await");
    SpecialVars.Template = new Var("$Template");
    SpecialVars.ComputedPropertyName = "$ComputedPropertyName";
    SpecialVars.UNKNOWN = "$UNKNOWN";
    return SpecialVars;
}());
// utilities
function flatMap(xs, f) {
    return xs.reduce(function (acc, x) { return acc.concat(f(x)); }, []);
}
exports.flatMap = flatMap;
function forNode(node, action) {
    try {
        return action();
    }
    catch (e) {
        console.debug("Error occurred when processing node: " + node.getText());
        throw e;
    }
}
exports.forNode = forNode;
function getLineNumber(node) {
    var src = node.getSourceFile();
    var line = src.getLineAndCharacterOfPosition(node.getStart()).line;
    return line + 1;
}
exports.getLineNumber = getLineNumber;
function getSrcSpan(node) {
    var src = node.getSourceFile();
    var start = src.getLineAndCharacterOfPosition(node.getStart());
    var end = src.getLineAndCharacterOfPosition(node.getEnd());
    return [[start.line, start.character], [end.line, end.character]];
}
exports.getSrcSpan = getSrcSpan;
function parseFiles(sources, libraryFiles) {
    var program = ts.createProgram(libraryFiles, {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS
    });
    program.getSemanticDiagnostics(undefined, undefined); //call this to store type info into nodes
    var checker = program.getTypeChecker(); // must call this to link source files to nodes
    var warnnings = [];
    var sFiles = sources
        .map(function (file) { return mustExist(program.getSourceFile(file), "getSourceFile failed for: " + file); })
        .filter(function (sc) {
        var noError = program.getSyntacticDiagnostics(sc).length == 0;
        if (!noError) {
            warnnings.push("file " + sc.fileName + " has syntactic error, skipped.");
        }
        return noError;
    });
    mustExist(sFiles);
    var parser = new StmtParser(checker);
    return [sFiles.map(function (src, index) {
            var stmts = [];
            src.statements.forEach(function (s) {
                try {
                    var r = parser.parseStmt(s);
                    r.forEach(function (s) { return stmts.push(s); });
                }
                catch (e) {
                    console.error("Parsing failed for file: " + src.fileName);
                    throw e;
                }
            });
            return new GModule(sources[index], stmts);
        }), warnnings];
}
exports.parseFiles = parseFiles;
function handleError(node, thunk) {
    // return thunk();
    try {
        return thunk();
    }
    catch (e) {
        var line = getLineNumber(node);
        console.log("Failure occurred at line " + line + ": " + node.getText());
        console.log("Error message: " + e.message);
        throw e;
    }
}
function useOrElse(v, f, backup) {
    if (v) {
        return f(v);
    }
    else {
        return backup;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhcnNpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0JBQWlDO0FBQ2pDLHlDQUFrRTtBQUdsRTtJQUNFLGlCQUFtQixJQUFZLEVBQVMsS0FBYztRQUFuQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVMsVUFBSyxHQUFMLEtBQUssQ0FBUztJQUN0RCxDQUFDO0lBQ0gsY0FBQztBQUFELENBQUMsQUFIRCxJQUdDO0FBSFksMEJBQU87QUFLcEIsU0FBZ0IsU0FBUyxDQUFJLENBQUssRUFBRSxHQUFZO0lBQzlDLElBQUksQ0FBQyxDQUFDLEVBQUU7UUFDTixJQUFJLEdBQUcsRUFBRTtZQUNQLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDakQ7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDakM7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQVRELDhCQVNDO0FBT0Q7SUFHRSxtQkFBbUIsRUFBUztRQUFULE9BQUUsR0FBRixFQUFFLENBQU87UUFGWixhQUFRLEdBQUcsV0FBVyxDQUFDO0lBR3ZDLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFMRCxJQUtDO0FBRUQ7SUFHRSxrQkFBbUIsRUFBUztRQUFULE9BQUUsR0FBRixFQUFFLENBQU87UUFGWixhQUFRLEdBQUcsVUFBVSxDQUFDO0lBR3RDLENBQUM7SUFDSCxlQUFDO0FBQUQsQ0FBQyxBQUxELElBS0M7QUFLRDtJQUdFLGNBQW1CLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBRmYsYUFBUSxHQUFHLE1BQU0sQ0FBQztRQUdoQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsQ0FBQztJQUNILFdBQUM7QUFBRCxDQUFDLEFBTkQsSUFNQztBQUVEO0lBSUU7UUFIZ0IsYUFB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
let detailed = true;
const NUMBER = detailed ? "NUMBER" : 1;
const OPERATOR = detailed ? "OPERATOR" : 2;
const OPERATION = detailed ? "OPERATION" : 3;

const OPERATORS = ["-", "+", "*", "/"]
const SPECIAL_TOKENS = ["(", ")", ";"]

const isNumber = val => !isNaN(val);
const isOperator = val => OPERATORS.indexOf(val) !== -1
const isSpecialToken = val => SPECIAL_TOKENS.indexOf(val) !== -1
const isWhiteSpace = val => [" ", "\n"].indexOf(val) !== -1;
const valueToToken = val => {
    if (isNumber(val)) {
        return { type: NUMBER, val }
    } else if (isOperator(val)) {
        return { type: OPERATOR, val }
    } else {
        return { type: val }
    }
}

function Interpreter() { };

Interpreter.prototype.tokenize = function (source) {
    let tokens = [];
    let current = "";
    for (let x = 0; x < source.length; x++) {
        let ch = source[x];
        if (isWhiteSpace(ch) && !current) continue;

        let next_ch = source[x + 1]
        if (!isWhiteSpace(ch)) current += ch;
        if (
            isOperator(ch) ||
            isSpecialToken(ch) ||
            isSpecialToken(next_ch) ||
            isOperator(next_ch) ||
            !ch || isWhiteSpace(ch) ||
            x === source.length - 1
        ) {
            if (isWhiteSpace(ch) && current === " ") continue;
            let token = valueToToken(current);
            tokens.push(token)
            current = "";
        }
    }
    return tokens;
}

Interpreter.prototype.parse = function (tokens) {
    let statements = [];
    let tmp = [];
    for (let t of tokens) {
        if (t.type !== ";") tmp.push(t)
        else {
            statements.push(tmp);
            tmp = [];
        }
    }
    return this.parseStatements(statements)
}

Interpreter.prototype.parseStatements = function (statements) {
    let ast = [];
    for (stmt of statements) {
        let node = this.parseStatement(stmt);
        ast.push(node);
    }
    return ast
}

Interpreter.prototype.parseStatement = function (statement) {
    for (rule of exprRules) {
        let result = rule(statement);
        if (result) return result;
    }
    return false
}

const numberRule = stmt => {
    return stmt.length === 1 && stmt[0].type === NUMBER && {
        type: NUMBER,
        val: stmt[0].val
    }
}

const sliceOperation = tokens => {
    let i = -1
    let skip = 0;
    tokens.find((x, z) => {
        if (x.type === "(") skip++;
        let true_ = x.type === ")"
        if (true_) { i = z; skip-- }
        return true_ && !skip;
    });
    if (i === -1) throw new Error("sliceToClosestParen.index not found")
    i++; // to get closing paren ")" too
    return { tokens: tokens.slice(0, i), i };
}

const handleSubOperation = (from, stmt) => {
    let after = stmt.slice(from);
    let { tokens, i } = sliceOperation(after)
    let node = operationRule(tokens);
    return { node, i };
}

const operationRule = stmt => {
    if (stmt[0].type !== "(") return false
    if (stmt[stmt.length - 1].type !== ")") return false
    if (!isOperator(stmt[1].val)) return false;
    let left_node;
    let right_node;
    if (stmt[2].type === NUMBER) {
        left_node = stmt[2]
        if (stmt[3].type === NUMBER) {
            right_node = stmt[3]
        } else if (stmt[3].type === "(") {
            right_node = handleSubOperation(3, stmt).node;
        }
    } else if (stmt[2].type === "(") {
        let { node, i } = handleSubOperation(2, stmt);
        i += 2;
        left_node = node;
        if (stmt[i].type === NUMBER) {
            right_node = stmt[i]
        } else if (stmt[i].type === "(") {
            right_node = handleSubOperation(i, stmt).node;
        }
    }
    return { type: OPERATION, op: stmt[1].val, left: left_node, right: right_node }
}

let exprRules = [numberRule, operationRule];

Interpreter.prototype.evaluateNode = function (node) {
    if (node.type === NUMBER) return Number(node.val);
    else if (node.type === OPERATION) {
        let op = node.op;
        let val1 = this.evaluateNode(node.left)
        let val2 = this.evaluateNode(node.right)
        if (isNaN(val1) || isNaN(val2)) return isNaN(val1) ? val1 : val2
        return eval(`${val1} ${op} ${val2}`)
    }
}

Interpreter.prototype.evaluate = function (ast) {
    let results = [];
    for (node of ast) {
        let result = this.evaluateNode(node);
        results.push(result);
    }
    return results
}

Interpreter.prototype.run = function (source) {
    let tokens = this.tokenize(source);
    let ast = this.parse(tokens);
    console.log(JSON.stringify(ast, null, " "))
    let results = this.evaluate(ast);
    return results[results.length - 1]
}


var prompt = require('prompt');

prompt.start();

let interpreter = new Interpreter()

let askForInput = (interpreter) => {
    prompt.get(['>>> '], function (err, result) {
        //
        // Log the results.
        //
        let output = interpreter.run(result[">>> "])
        console.log(output)
        askForInput(interpreter);
    });
}
askForInput(interpreter);
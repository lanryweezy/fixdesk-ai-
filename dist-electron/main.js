var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "16.6.1",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path2 = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path2.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path2.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path2.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      const quiet = options && "quiet" in options ? options.quiet : true;
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path3 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path3, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path3} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path2.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// electron/main.ts
var import_electron = require("electron");
var path = __toESM(require("node:path"), 1);
var import_robotjs = __toESM(require("robotjs"), 1);

// node_modules/lowdb/lib/adapters/node/TextFile.js
var import_promises2 = require("node:fs/promises");

// node_modules/steno/lib/index.js
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var import_node_url = require("node:url");
function getTempFilename(file) {
  const f = file instanceof URL ? (0, import_node_url.fileURLToPath)(file) : file.toString();
  return (0, import_node_path.join)((0, import_node_path.dirname)(f), `.${(0, import_node_path.basename)(f)}.tmp`);
}
async function retryAsyncOperation(fn, maxRetries, delayMs) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
}
var Writer = class {
  #filename;
  #tempFilename;
  #locked = false;
  #prev = null;
  #next = null;
  #nextPromise = null;
  #nextData = null;
  // File is locked, add data for later
  #add(data) {
    this.#nextData = data;
    this.#nextPromise ||= new Promise((resolve, reject) => {
      this.#next = [resolve, reject];
    });
    return new Promise((resolve, reject) => {
      this.#nextPromise?.then(resolve).catch(reject);
    });
  }
  // File isn't locked, write data
  async #write(data) {
    this.#locked = true;
    try {
      await (0, import_promises.writeFile)(this.#tempFilename, data, "utf-8");
      await retryAsyncOperation(async () => {
        await (0, import_promises.rename)(this.#tempFilename, this.#filename);
      }, 10, 100);
      this.#prev?.[0]();
    } catch (err) {
      if (err instanceof Error) {
        this.#prev?.[1](err);
      }
      throw err;
    } finally {
      this.#locked = false;
      this.#prev = this.#next;
      this.#next = this.#nextPromise = null;
      if (this.#nextData !== null) {
        const nextData = this.#nextData;
        this.#nextData = null;
        await this.write(nextData);
      }
    }
  }
  constructor(filename) {
    this.#filename = filename;
    this.#tempFilename = getTempFilename(filename);
  }
  async write(data) {
    return this.#locked ? this.#add(data) : this.#write(data);
  }
};

// node_modules/lowdb/lib/adapters/node/TextFile.js
var TextFile = class {
  #filename;
  #writer;
  constructor(filename) {
    this.#filename = filename;
    this.#writer = new Writer(filename);
  }
  async read() {
    let data;
    try {
      data = await (0, import_promises2.readFile)(this.#filename, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return data;
  }
  write(str) {
    return this.#writer.write(str);
  }
};

// node_modules/lowdb/lib/adapters/node/DataFile.js
var DataFile = class {
  #adapter;
  #parse;
  #stringify;
  constructor(filename, { parse, stringify }) {
    this.#adapter = new TextFile(filename);
    this.#parse = parse;
    this.#stringify = stringify;
  }
  async read() {
    const data = await this.#adapter.read();
    if (data === null) {
      return null;
    } else {
      return this.#parse(data);
    }
  }
  write(obj) {
    return this.#adapter.write(this.#stringify(obj));
  }
};

// node_modules/lowdb/lib/adapters/node/JSONFile.js
var JSONFile = class extends DataFile {
  constructor(filename) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data) => JSON.stringify(data, null, 2)
    });
  }
};

// node_modules/lowdb/lib/adapters/Memory.js
var Memory = class {
  #data = null;
  read() {
    return Promise.resolve(this.#data);
  }
  write(obj) {
    this.#data = obj;
    return Promise.resolve();
  }
};

// node_modules/lowdb/lib/core/Low.js
function checkArgs(adapter, defaultData) {
  if (adapter === void 0)
    throw new Error("lowdb: missing adapter");
  if (defaultData === void 0)
    throw new Error("lowdb: missing default data");
}
var Low = class {
  adapter;
  data;
  constructor(adapter, defaultData) {
    checkArgs(adapter, defaultData);
    this.adapter = adapter;
    this.data = defaultData;
  }
  async read() {
    const data = await this.adapter.read();
    if (data)
      this.data = data;
  }
  async write() {
    if (this.data)
      await this.adapter.write(this.data);
  }
  async update(fn) {
    fn(this.data);
    await this.write();
  }
};

// node_modules/lowdb/lib/presets/node.js
async function JSONFilePreset(filename, defaultData) {
  const adapter = process.env.NODE_ENV === "test" ? new Memory() : new JSONFile(filename);
  const db2 = new Low(adapter, defaultData);
  await db2.read();
  return db2;
}

// electron/main.ts
var import_child_process = require("child_process");

// services/ai.ts
var import_generative_ai = require("@google/generative-ai");
var import_dotenv = __toESM(require_main(), 1);
import_dotenv.default.config();
var genAI = new import_generative_ai.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function analyzeTicket(description) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Analyze the following support ticket description and determine a priority and category.
    Description: "${description}"

    Respond with a JSON object containing "priority" and "category" fields.
    Priority should be one of: "Low", "Medium", "High", "Urgent".
    Category should be one of: "Hardware", "Software", "Network", "Account", "Other".
    `;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    const jsonText = text.replace(/```json\n/g, "").replace(/\n```/g, "");
    const analysis = JSON.parse(jsonText);
    return {
      priority: analysis.priority || "Medium",
      category: analysis.category || "Other"
    };
  } catch (error) {
    console.error("Error analyzing ticket:", error);
    return {
      priority: "Medium",
      category: "Other"
    };
  }
}

// electron/main.ts
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(process.env.DIST, "../public") : process.env.DIST;
var win;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var db;
var initDatabase = async () => {
  const defaultData = { tickets: [], solutions: [] };
  const dbPath = path.join(import_electron.app.getPath("userData"), "db.json");
  db = await JSONFilePreset(dbPath, defaultData);
};
function createWindow() {
  win = new import_electron.BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC || "", "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
    win = null;
  }
});
import_electron.app.on("activate", () => {
  if (import_electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
import_electron.ipcMain.handle("desktop-capturer-get-sources", (event, opts) => {
  return import_electron.desktopCapturer.getSources(opts);
});
import_electron.ipcMain.handle("db-get-tickets", () => {
  return db.data.tickets;
});
import_electron.ipcMain.handle("db-create-ticket", async (event, ticket) => {
  const { priority, category } = await analyzeTicket(ticket.description);
  const ticketWithPriority = { ...ticket, priority, category };
  db.data.tickets.push(ticketWithPriority);
  await db.write();
  return ticketWithPriority;
});
import_electron.ipcMain.handle("db-get-ticket-by-id", (event, ticketId) => {
  return db.data.tickets.find((t) => t.id === ticketId);
});
import_electron.ipcMain.handle("db-create-solution", async (event, solution) => {
  const newSolution = { ...solution, id: `SOL-${Math.random().toString(36).substr(2, 9).toUpperCase()}` };
  db.data.solutions.push(newSolution);
  await db.write();
  return newSolution;
});
import_electron.ipcMain.handle("db-find-solutions", (event, problemDescription) => {
  const searchTerms = problemDescription.toLowerCase().split(" ");
  return db.data.solutions.filter((solution) => {
    const solutionTerms = solution.problemDescription.toLowerCase().split(" ");
    return searchTerms.some((term) => solutionTerms.includes(term));
  });
});
import_electron.ipcMain.handle("execute-command", async (event, commands) => {
  const execPromise = (command) => {
    return new Promise((resolve) => {
      (0, import_child_process.exec)(command, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });
  };
  const results = { stdout: "", stderr: "" };
  for (const command of commands) {
    const result = await execPromise(command);
    results.stdout += result.stdout;
    results.stderr += result.stderr;
    if (result.stderr) {
      break;
    }
  }
  return results;
});
import_electron.ipcMain.on("robot-mouse-move", (event, { x, y }) => {
  const { width, height } = import_robotjs.default.getScreenSize();
  const absoluteX = Math.round(x * width);
  const absoluteY = Math.round(y * height);
  import_robotjs.default.moveMouse(absoluteX, absoluteY);
});
import_electron.ipcMain.on("robot-mouse-click", (event) => {
  import_robotjs.default.mouseClick();
});
import_electron.ipcMain.on("robot-key-tap", (event, key) => {
  import_robotjs.default.keyTap(key);
});
import_electron.app.whenReady().then(initDatabase).then(createWindow);

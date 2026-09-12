import { stubFor, languageOptions } from "../exercise-stubs";

describe("stubFor", () => {
  const baseExercise = {
    starterCode: "// starter",
    languages: ["node"],
    graderConfig: { entry: "solve" },
  };

  test("native language returns starterCode verbatim", () => {
    const result = stubFor("OUTPUT_MATCH", "node", baseExercise);
    expect(result).toBe("// starter");
  });

  test("native language with no starterCode returns empty string", () => {
    const result = stubFor("OUTPUT_MATCH", "node", { languages: ["node"] });
    expect(result).toBe("");
  });

  test("OUTPUT_MATCH + non-native python returns a read-stdin scaffold", () => {
    const result = stubFor("OUTPUT_MATCH", "python", baseExercise);
    // must mention input() or sys.stdin or sys
    expect(result).toMatch(/sys|stdin|input\(\)/i);
  });

  test("OUTPUT_MATCH + non-native node returns a readline/stdin scaffold", () => {
    const result = stubFor("OUTPUT_MATCH", "node", {
      ...baseExercise,
      languages: ["python"], // native is python, so node is non-native
    });
    expect(result).toMatch(/readline|stdin|process\.stdin/i);
  });

  test("FUNCTION_CALL dynamic (node) non-native returns function stub with entry name", () => {
    const result = stubFor("FUNCTION_CALL", "node", {
      ...baseExercise,
      languages: ["python"], // native python, node is non-native
    });
    expect(result).toContain("solve"); // entry name
    expect(result).toMatch(/function solve/i);
  });

  test("FUNCTION_CALL dynamic (python) non-native returns def stub with entry name", () => {
    const result = stubFor("FUNCTION_CALL", "python", {
      starterCode: "// starter",
      languages: ["node"], // native node, python is non-native
      graderConfig: { entry: "solve" },
    });
    expect(result).toContain("solve");
    expect(result).toMatch(/def solve/i);
  });

  test("FUNCTION_CALL static (rust) WITH signature returns typed stub", () => {
    const result = stubFor("FUNCTION_CALL", "rust", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["int"], returns: "int" },
      },
    });
    expect(result).toContain("solve");
    expect(result).toMatch(/fn solve|i32/i);
  });

  test("FUNCTION_CALL static (java) WITH signature generates a Java-typed stub from DSL types", () => {
    const result = stubFor("FUNCTION_CALL", "java", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["int", "string[]"], returns: "bool" },
      },
    });
    expect(result).toContain("public static boolean");
    expect(result).toContain("int a");
    expect(result).toContain("String[] b");
  });

  test("FUNCTION_CALL static (kotlin) WITH signature generates a Kotlin-typed stub from DSL types", () => {
    const result = stubFor("FUNCTION_CALL", "kotlin", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["int", "string[]"], returns: "bool" },
      },
    });
    expect(result).toContain("fun solve");
    expect(result).toContain("a: Int");
    // string[] mirrors mb-executor's kotlinNat literally: "StringArray", not Array<String>.
    expect(result).toContain("b: StringArray");
    expect(result).toContain(": Boolean");
  });

  test("FUNCTION_CALL static (kotlin) uses Kotlin's primitive array types for 1-D int arrays", () => {
    const result = stubFor("FUNCTION_CALL", "kotlin", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["int[]"], returns: "int[]" },
      },
    });
    expect(result).toContain("a: IntArray");
    expect(result).toContain(": IntArray");
    // Must NOT emit the non-interchangeable Array<Int> form.
    expect(result).not.toContain("Array<Int>");
  });

  test("FUNCTION_CALL static (kotlin) wraps 2-D int arrays as Array<IntArray>", () => {
    const result = stubFor("FUNCTION_CALL", "kotlin", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["int[][]"], returns: "int" },
      },
    });
    expect(result).toContain("a: Array<IntArray>");
  });

  test("FUNCTION_CALL static (kotlin) uses Kotlin's primitive array types for bool/long/double arrays", () => {
    const result = stubFor("FUNCTION_CALL", "kotlin", {
      ...baseExercise,
      graderConfig: {
        entry: "solve",
        signature: { params: ["bool[]", "long[]", "double[]"], returns: "int" },
      },
    });
    expect(result).toContain("a: BooleanArray");
    expect(result).toContain("b: LongArray");
    expect(result).toContain("c: DoubleArray");
  });

  test("FUNCTION_CALL static (rust) WITHOUT signature returns comment stub", () => {
    const result = stubFor("FUNCTION_CALL", "rust", {
      ...baseExercise,
      graderConfig: { entry: "solve" }, // no signature
    });
    // should be a comment placeholder, no typed function body
    expect(result).toMatch(/\/\/|\/\*/);
  });

  test("TEST_CASES returns starterCode (native language)", () => {
    const result = stubFor("TEST_CASES", "node", baseExercise);
    expect(result).toBe("// starter");
  });
});

describe("languageOptions", () => {
  const exerciseWithSig = {
    languages: ["node"],
    graderConfig: {
      entry: "solve",
      signature: { params: [], returns: "void" },
    },
  };
  const exerciseNoSig = {
    languages: ["node"],
    graderConfig: { entry: "solve" },
  };

  test("OUTPUT_MATCH returns all 13 languages", () => {
    const opts = languageOptions("OUTPUT_MATCH", exerciseWithSig);
    expect(opts).toHaveLength(13);
  });

  test("OUTPUT_MATCH includes c and scala", () => {
    const opts = languageOptions("OUTPUT_MATCH", exerciseWithSig);
    const codes = opts.map((o) => o.value);
    expect(codes).toContain("c");
    expect(codes).toContain("scala");
  });

  test("OUTPUT_MATCH does NOT include swift or typescript", () => {
    const opts = languageOptions("OUTPUT_MATCH", exerciseWithSig);
    const codes = opts.map((o) => o.value);
    expect(codes).not.toContain("swift");
    expect(codes).not.toContain("typescript");
  });

  test("FUNCTION_CALL with signature returns all 13 languages", () => {
    const opts = languageOptions("FUNCTION_CALL", exerciseWithSig);
    expect(opts).toHaveLength(13);
  });

  test("FUNCTION_CALL without signature returns only 5 dynamic langs", () => {
    const opts = languageOptions("FUNCTION_CALL", exerciseNoSig);
    expect(opts).toHaveLength(5);
    expect(opts.map((o) => o.value)).toEqual(
      expect.arrayContaining(["node", "python", "php", "ruby", "perl"])
    );
  });

  test("TEST_CASES returns only the single authored language", () => {
    const opts = languageOptions("TEST_CASES", exerciseWithSig);
    expect(opts).toHaveLength(1);
    expect(opts[0].value).toBe("node");
  });

  test("OUTPUT_MATCH with a driver is locked to the authored language", () => {
    const opts = languageOptions("OUTPUT_MATCH", { languages: ["java"], graderConfig: { driver: "public class Main {}" } } as any);
    expect(opts.map((o) => o.value)).toEqual(["java"]);
  });

  test("OUTPUT_MATCH without a driver offers every language", () => {
    expect(languageOptions("OUTPUT_MATCH", { languages: ["java"] } as any)).toHaveLength(13);
  });
});

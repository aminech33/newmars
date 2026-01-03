/**
 * Templates de code de démarrage pour différents langages
 */

export function getStarterCode(language: string, courseName: string): string {
  const starters: Record<string, string> = {
    python: `# ${courseName}\n\n# Écris ton code Python ici\nprint("Hello, World!")\n`,
    javascript: `// ${courseName}\n\n// Écris ton code JavaScript ici\nconsole.log("Hello, World!");\n`,
    typescript: `// ${courseName}\n\n// Écris ton code TypeScript ici\nconst message: string = "Hello, World!";\nconsole.log(message);\n`,
    java: `// ${courseName}\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
    cpp: `// ${courseName}\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
    csharp: `// ${courseName}\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
    rust: `// ${courseName}\n\nfn main() {\n    println!("Hello, World!");\n}\n`,
    go: `// ${courseName}\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
    php: `<?php\n// ${courseName}\n\n// Écris ton code PHP ici\necho "Hello, World!";\n`,
    ruby: `# ${courseName}\n\n# Écris ton code Ruby ici\nputs "Hello, World!"\n`
  }
  
  return starters[language] || `// ${courseName}\n\n// Écris ton code ici\n`
}


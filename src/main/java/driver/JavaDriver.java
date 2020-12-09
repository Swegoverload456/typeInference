package driver;


import lambdanet.TypeInferenceService;
import lambdanet.TypeInferenceService$;

public class JavaDriver {
    private static int changeDir = 0;
    private static String cwd = "n";
    public static void main(String[] args) {

        var api = lambdanet.JavaAPI$.MODULE$;
        var typeInfer = TypeInferenceService$.MODULE$;
        System.out.println(api.pwd());
        //Windows Path
        //String rootDir = "C:/cliInference/";
        //Linux Path
        String rootDir = "/usr/local/cliInference/Resources";
        var importDir = api.absPath(rootDir);
        var modelDir = api.joinPath(importDir,
                "models/newParsing-GAT1-fc2-newSim-decay-6");
        var paramPath = api.joinPath(modelDir, "params.serialized");
        var modelCachePath = api.joinPath(modelDir, "model.serialized");
        var modelConfig = api.defaultModelConfig();
        var parsedReposDir = api.joinPath(importDir, "data/parsedRepos");

        var model = typeInfer.loadModel(paramPath, modelCachePath, modelConfig, 8, parsedReposDir);
        var predService = api.predictionService(model, 8, 5);
        System.out.println("Type Inference Service successfully started.");
        System.out.println("Please type the directory of the file or project: ");
        System.out.flush();
        var in = api.readLine();
        var workDir = api.absPath(in);
        System.out.println("Current working directory: " + workDir);

        for (int i = 0; i < 1000; i++) {
            if(changeDir == 2) {
                System.out.println("Please type the directory of the file or project: ");
                System.out.flush();
                in = api.readLine();
                workDir = api.absPath(in);
                System.out.println("Current working directory: " + workDir);
            }
            changeDir = 0;
            // limit max loop iterations to 1000 in case something wrong happens
            System.out.print("(NO SLASH AT THE FRONT) Enter project path: /");
            System.out.flush();
            var line = api.readLine();
            try {
                assert !line.strip().isEmpty() : "Specified path should not be empty.";
                var sourcePath = api.joinPath(workDir, line);
                String[] skipSet = {"node_modules"};
                var results =
                        predService.predictOnProject(sourcePath, false, skipSet);
                var mb = 1024*1024;
                var runtime = Runtime.getRuntime();
                System.out.println("RAM USAGE. ALL RESULTS IN MB");
                System.out.println("** Used Memory:  " + (runtime.totalMemory() - runtime.freeMemory()) / mb);
                System.out.println("** Free Memory:  " + runtime.freeMemory() / mb);
                System.out.println("** Total Memory: " + runtime.totalMemory() / mb);
                System.out.println("** Max Memory:   " + runtime.maxMemory() / mb);
                new TypeInferenceService.PredictionResults(results).prettyPrint();
                System.out.println("DONE");
            } catch (Throwable e) {
                System.out.println("Got exception: " + e.getMessage());
                e.printStackTrace();
            }
            while (changeDir == 0) {
                System.out.println("Would you like to change the current working directory or exit the program? For directory enter Y/y or N/n. For exit enter E/e: ");
                System.out.flush();
                cwd = api.readLine();
                if (cwd.equals("n") || cwd.equals("N")) {
                    changeDir = 1;
                } else if (cwd.equals("y") || cwd.equals("Y")) {
                    changeDir = 2;
                } else if(cwd.equals("e") || cwd.equals("E")) {
                   System.exit(0);
                } else {
                    System.out.println("Your Answer was invalid. Please respond again.");
                    changeDir = 0;
                }
            }
        }
    }
}

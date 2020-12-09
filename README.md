This is the source code repository for textInference.
This project implements the LambdaNet library for type-hint suggestion into a Java CLI.
The source code for the LambdaNet repository: https://github.com/MrVPlusOne/LambdaNet

## Installation
Be sure to download the release that is specific to your operating system.
### Windows
1. Before running the program, you must run the windows batch file named "INSTALL.bat" in a terminal like command prompt or PowerShell. This will automatically install all dependencies that are needed for the project.

2. Move the "textInference.jar" wherever you please. Remember where you put it so you know where it is when it comes time to execute it.

### Linux
1. Before running the program, you must run the shell file named "INSTALL.sh" in the terminal.
   This will automatically install all dependencies that are needed for the project.

2. Move the "textInference.jar" wherever you please. Remember where you put it so you know where it is when it comes time to execute it.

## Running the Program
### Windows
1. Open your preferred terminal and change directories to where the "textInference.jar" is stored.
   I.e. If you put "textInference.jar" on your desktop, use the command: cd Desktop to change directories to your desktop

2. Once you have located the directory where the file is located, you will enter the command: java -jar textInference.jar
   This will start the program

3. Wait for the program to load the pre-trained model. (This can take anywhere from 30 seconds to 3 minutes so be patient)

4. Once the program outputs "Please type the directory of the file or project: ", enter the path where the project(s) that you will be inputting is located.
   The directory that you input is saved as the Current Working Directory incase you have multiple projects in the same Directory.
   I.e. If the project(s) you are importing is in a folder called "Typescript Projects", located in your Documents, then the path that you would input would be:
   C:\Users\'Your Username'\Documents\Typescript Projects

5. The program will then respond with "(NO SLASH AT THE FRONT) Enter project path: /". This is used if you have multiple projects within your Current Working Directory.
   If you do not have multiple projects in the Current Working Directory, then you can simply sumbit no directory and it will scan the Current Working Directory.
   If you do have multiple projects, you will input it with no '/' before the path, just the name of the first folder and following that you will follow every directory
   with slashed.
   I.e. "(NO SLASH AT THE FRONT) Enter project path: /"
        folder/folder2/...

6. The program will then calculate the results and print them.

7. You then have the choice of inputting another path, either by changing the Current Working Directory or by using the previous Current Working Directory, or to
   exit the program.

### Linux
1. Before running the program, you must run the shell file named "INSTALL.sh".
   This will automatically install all dependencies that are needed for the project.
   I. You must open the terminal and locate the folder that you extracted using {cd ...}
   II. You then have to run the command: chmod +x INSTALL.sh
   III. Run the command: ./INSTALL.sh


2. Once you have located the directory where the file is located, you will enter the command: java -jar textInference.jar
   This will start the program

3. Wait for the program to load the pre-trained model. (This can take anywhere from 30 seconds to 3 minutes so be patient)

4. Once the program outputs "Please type the directory of the file or project: ", enter the path where the project(s) that you will be inputting is located.
   The directory that you input is saved as the Current Working Directory incase you have multiple projects in the same Directory.
   I.e. If the project(s) you are importing is in a folder called "Typescript Projects", located in your Documents, then the path that you would input would be:
   /home/"YOUR USERNAME"/Documents/Typescript Projects

5. The program will then respond with "(NO SLASH AT THE FRONT) Enter project path: /". This is used if you have multiple projects within your Current Working Directory.
   If you do not have multiple projects in the Current Working Directory, then you can simply sumbit no directory and it will scan the Current Working Directory.
   If you do have multiple projects, you will input it with no '/' before the path, just the name of the first folder and following that you will follow every directory
   with slashed.
   I.e. "(NO SLASH AT THE FRONT) Enter project path: /"
        folder/folder2/...

6. The program will then calculate the results and print them.

7. You then have the choice of inputting another path, either by changing the Current Working Directory or by using the previous Current Working Directory, or to
   exit the program.

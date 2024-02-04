import { test } from '@playwright/test';

test('crawling fiap course content', async ({ page }) => {
  test.setTimeout(120000); //2 minutes

  await page.goto(process.env.FIAP_URL + '/programas/login/alunos_2004/apostilas_2007/default.asp?titulo_secao=Apostilas');

  // Click the class name to expand the list of subjects.
  await page.getByText(process.env.FIAP_CLASS_NAME??"").click();

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  // Get all subjects inside class name, but including the class name itself, which is not a subject.
  const subjects = await page.locator('.i-apostilas-item').all();
  subjects.shift(); // remove first element, which is from class name itself, not a subject.
  console.log(subjects.length + " subjects found");
  
  const subjectAndTeacherWithoutTrimList:string[] = [];
  const subjectIdToSubjectName = {};
  const subjectNameToCountOfDownloadableContent = {};
  // const teacherList:string[] = [];

  for (const subject of subjects) {
    const text = await subject.innerText();
    const id = await subject.getAttribute("id");
    if (id !== null) {
      subjectIdToSubjectName[id] = text.trim().split("\n")[0];
      subjectNameToCountOfDownloadableContent[text.trim().split("\n")[0]] = 0;
    }
    subjectAndTeacherWithoutTrimList.push(text);
    // teacherList.push(text.trim().split("\n")[1]);
  }
  console.log(Object.keys(subjectIdToSubjectName).length + " subject ids and names found");

  for (const subjectAndTeacherWithoutTrim of subjectAndTeacherWithoutTrimList) {

    const subjectExpandableElement = await page.getByText(subjectAndTeacherWithoutTrim);
    await subjectExpandableElement.click();
  }
  console.log("All subjects expanded");

  await delay(1000); // <-- prevent loading screen, that also count as image, to mess the indexes

  //Now that the groups inside subjects appear, iterate over all images to expand those plus signs to expand the list of course content.
  var images = await page.locator('img').all(); //Filter by src="./login/alunos_2004/apostilas_2007/mais.gif"
  for (const i of images) {
    const srcAttribute = await i.getAttribute("src");

    if (srcAttribute?.includes("login/alunos_2004/apostilas_2007/mais.gif")) {
      await i.click();
      await delay(1000); // <-- prevent loading screen, that also count as image, to mess the indexes
    }
  }
  console.log("Pending subgroups expanded");

  //With all expanded...
  const iApostilasSubitem = await page.locator('.i-apostilas-subitem').all();
  console.log(iApostilasSubitem.length + " downloadable course content found");

  const fiapCourseContentDirectory = 'fiap-course-content';

  for (const apostilaSubitem of iApostilasSubitem) {
    const idApostilaSubitem = await apostilaSubitem.getAttribute("id");

    if (idApostilaSubitem !== null) {
      const expectedSubjectId:string = idApostilaSubitem.replace('arquivo','');
      const foundSubject = subjectIdToSubjectName[expectedSubjectId];
      subjectNameToCountOfDownloadableContent[foundSubject] = subjectNameToCountOfDownloadableContent[foundSubject] + 1;
    }
  }
  console.log("Downloadable content count by subject: ");
  console.log(subjectNameToCountOfDownloadableContent);

  //TODO: On S3, count all files inside each subject folder, and compare with those here, to avoid downloading the same files per subject again.

  for (const apostilaSubitem of iApostilasSubitem) {
    const idApostilaSubitem = await apostilaSubitem.getAttribute("id");

    if (idApostilaSubitem !== null) {
      const expectedSubjectId:string = idApostilaSubitem.replace('arquivo','');
      const foundSubject = subjectIdToSubjectName[expectedSubjectId];

      const clickableSpan = await apostilaSubitem.locator("span").first();
      
      const downloadPromise = page.waitForEvent('download');
      await clickableSpan.click();
      const download = await downloadPromise;
  
      await download.saveAs(fiapCourseContentDirectory + '/' + foundSubject + '/' + download.suggestedFilename()); 

    }
  }

  const fs = require('fs');
  const directories = fs.readdirSync(fiapCourseContentDirectory);
  console.log();
  console.log("After download, the following files were created: ")
  console.log(directories.length + " directories on directory /" + fiapCourseContentDirectory);

  //Show quantity of files of each directory inside fiap-course-content
  for (const directory of directories) {
    const files = fs.readdirSync(fiapCourseContentDirectory + '/' + directory);
    console.log(files.length + " files on directory /" + fiapCourseContentDirectory + '/' + directory);
  }

  await page.locator(".l-content").screenshot({ path: `evidences/evidence1-all-expanded.png` });
});

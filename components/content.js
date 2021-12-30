import { html } from "uhtml";
import { Base } from "./base";
import db from "../db";
import { Data } from "../data";
import XLSX from "xlsx";
import { strFromU8 } from "fflate";

/** @param {File} file */
async function readLocalSheet(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    header.push(sheet[XLSX.utils.encode_cell({ r: 0, c })]?.v);
  }
  /** @type {Rows} */
  const dataArray = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    /** @type {Row} */
    const row = { tags: [] };
    const tags = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const name = header[c];
      if (!name) continue;
      const value = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
      if (!value) continue;
      if (name.startsWith("tags")) {
        tags.push(value);
      } else {
        row[name] = value;
      }
    }
    row["tags"] = tags;
    if (Object.keys(row).length > 0) {
      dataArray.push(row);
    }
  }
  await db.write("content", dataArray);
  return { fields: header.filter((h) => h), rows: dataArray.length, dataArray };
}

export class Content extends Base {
  template() {
    return html` <div class="content">
      <label for="remoteFileInput">Load a Google Sheets spreadsheet: </label>
      <input
        id="remoteFileInput"
        type="url"
        required="true"
        aria-required="true"
        onkeydown=${async (/** @type {InputEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          if (target.checkValidity() && e.key == "Enter") {
            const urlEnd = target.value.indexOf("/edit")
            if(urlEnd != -1) {
              const sheetURL = `${target.value.slice(0, urlEnd)}/gviz/tq?tqx=out:csv&tq=SELECT *`; 

              const result = await readLocalSheet(
                await fetch(sheetURL).then((response) => response)
              );

              document.querySelector(
                "#loadStatus"
              ).innerHTML = `Loaded ${result.rows} rows with ${result.fields.length} columns`;

              this.context.data = new Data(result.dataArray);
              this.context.state.update();
            } else {
              console.error("Invalid Google sheet url");
            } 
          }
        }}
      />

      <label for="localFileInput">Load a local spreadsheet: </label>
      <input
        id="localFileInput"
        type="file"
        onchange=${async (/** @type {InputEvent} e */ e) => {
          const target = /** @type {HTMLInputElement} */ (e.target);
          const result = await readLocalSheet(target.files[0]);
          document.querySelector(
            "#loadStatus"
          ).innerHTML = `Loaded ${result.rows} rows with ${result.fields.length} columns`;
          this.context.data = new Data(result.dataArray);
          this.context.state.update();
        }}
      />
      <p id="loadStatus" style="margin-left: 2em"></p>
    </div>`;
  }
}

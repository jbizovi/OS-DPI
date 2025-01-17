import { html } from "uhtml";
import { Base, componentMap } from "./base";
import { styleString } from "./style";
import { formatSlottedString } from "./helpers";
import css from "ustyler";
import "./img-db";

class Grid extends Base {
  static defaultProps = {
    fillItems: false,
    rows: 3,
    columns: 3,
    filters: [],
    name: "grid",
    background: "white",
    scale: "1",
  };
  page = 1;
  pageBoundaries = { 0: 0 }; //track starting indices of pages
  /** @type {Object}
   * @property {string} key
   */
  cache = {};

  /** @param {Row} item */
  gridCell(item) {
    const { rules } = this.context;
    const { background, name } = this.props;
    let content;
    let msg = formatSlottedString(item.label || "");
    if (item.symbol) {
      content = html`<div>
        <figure>
          <img is="img-db" dbsrc=${item.symbol} title=${item.label || ""} />
          <figcaption>${msg}</figcaption>
        </figure>
      </div>`;
    } else {
      content = msg;
    }
    return html`<button
      onClick=${rules.handler(name, item, "press")}
      style=${styleString({ backgroundColor: background })}
      tabindex="-1"
    >
      ${content}
    </button>`;
  }

  emptyCell() {
    return html`<button tabindex="-1" disabled></button>`;
  }

  /** @param {Number} pages */
  pageSelector(pages) {
    const { state } = this.context;
    const { background } = this.props;

    return html`<div class="page-control">
      <div class="text">Page ${this.page} of ${pages}</div>
      <div class="back-next">
        <button
          onClick=${() => {
            this.page = ((((this.page - 2) % pages) + pages) % pages) + 1;
            state.update(); // trigger redraw
          }}
          style=${styleString({ backgroundColor: background })}
          .disabled=${this.page == 1}
          tabindex="-1"
        >
          &#9754;</button
        ><button
          onClick=${() => {
            this.page = (this.page % pages) + 1;
            state.update(); // trigger redraw
          }}
          style=${styleString({ backgroundColor: background })}
          .disabled=${this.page == pages}
          tabindex="-1"
        >
          &#9755;
        </button>
      </div>
    </div>`;
  }

  template() {
    /** @type {Partial<CSSStyleDeclaration>} */
    const style = {};
    const { data, state } = this.context;
    let { rows, columns, filters, fillItems } = this.props;
    /** @type {Rows} */
    let items = data.getRows(filters, state, this.cache);
    // reset the page when the key changes
    if (this.cache.updated) {
      this.page = 1;
    }
    let maxPage = 1;
    const result = [];
    if (!fillItems) {
      // collect the items for the current page
      // and get the dimensions
      let maxRow = 0,
        maxColumn = 0;
      const itemMap = new Map();
      /** @param {number} row
       * @param {number} column
       */
      const itemKey = (row, column) => row * 1000 + column;

      for (const item of items) {
        // ignore items without row and column
        if (!item.row || !item.column) continue;
        // get the max page value if any
        maxPage = Math.max(maxPage, item.page || 1);
        // collect the items on this page
        if (this.page == (item.page || 1)) {
          maxRow = Math.max(maxRow, item.row);
          maxColumn = Math.max(maxColumn, item.column);
          const key = itemKey(item.row, item.column);
          // only use the first one
          if (!itemMap.has(key)) itemMap.set(key, item);
        }
      }
      rows = maxRow;
      columns = maxColumn;
      for (let row = 1; row <= rows; row++) {
        for (let column = 1; column <= columns; column++) {
          if (maxPage > 1 && row == rows && column == columns) {
            // draw the page selector in the last cell
            result.push(this.pageSelector(maxPage));
          } else {
            const key = itemKey(row, column);
            if (itemMap.has(key)) {
              result.push(this.gridCell(itemMap.get(key)));
            } else {
              result.push(this.emptyCell());
            }
          }
        }
      }
    } else {
      // fill items sequentially
      let perPage = rows * columns;
      if (items.length > perPage) {
        perPage = perPage - 1;
      }
      maxPage = Math.ceil(items.length / perPage);
      // get the items on this page
      items = items.slice((this.page - 1) * perPage, this.page * perPage);
      // render them into the result
      for (const item of items) {
        result.push(this.gridCell(item));
      }
      // fill any spaces that remain
      for (let i = items.length; i < perPage; i++) {
        result.push(this.emptyCell());
      }
      // draw the page selector if needed
      if (maxPage > 1) {
        result.push(this.pageSelector(maxPage));
      }
    }

    style.gridTemplate = `repeat(${rows}, calc(100% / ${rows})) / repeat(${columns}, 1fr)`;

    return html`<div
      class="grid"
      id=${this.id}
      ref=${this}
      style=${styleString(style)}
    >
      ${result}
    </div>`;
  }
}
componentMap.addMap("grid", Grid);

css`
  .grid {
    display: grid;
    grid-auto-rows: 1fr;
    height: 100%;
    width: 100%;
  }

  .grid button {
    overflow-wrap: normal;
    overflow: hidden;
    border-radius: 5px;
    background-color: inherit;
  }
  .grid button div {
    display: flex;
    height: 100%;
  }
  .grid button figure {
    margin: 2px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
    justify-content: center;
  }
  body:not(.designing) img[dbsrc]:not([src]) {
    display: none;
  }
  .grid button figure figcaption {
    width: 100%;
  }
  .grid button figure img {
    object-fit: contain;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .grid b {
    color: blue;
  }
  .grid .page-control {
    display: flex;
    flex-direction: column;
  }
  .grid .page-control .text {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .grid .page-control .back-next {
    display: flex;
    flex: 1 1 0;
  }
  .grid .page-control .back-next button {
    flex: 1 1 0;
  }
`;

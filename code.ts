// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many shapes and connectors on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

type Position = {
  x: number;
  y: number;
};

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string; orientation: string }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "orientation-swap") {
    const currentViewPort = figma.currentPage.selection[0].absoluteBoundingBox;
    console.log(currentViewPort);
    if (msg.orientation === "columns" && currentViewPort) {
      const rowNodeXLow = currentViewPort.x - 10;
      const rowNodeXHigh = currentViewPort.x + 10;
      const columnHeaders: StickyNode[] = [];
      const otherNodes: StickyNode[] = [];
      const colHeadersOriginalPosition: Position[] = [];
      figma.currentPage.selection.forEach((node) => {
        if (node.type === "STICKY") {
          console.log(node.text.characters, "x:", node.x, "y:", node.y);
          if (node.x <= rowNodeXHigh && node.x >= rowNodeXLow) {
            columnHeaders.push(node);
            colHeadersOriginalPosition.push({ x: node.x, y: node.y });
          } else {
            otherNodes.push(node);
          }
        }
      });

      columnHeaders.forEach((header, index) => {
        header.y = currentViewPort.y;
        header.x = currentViewPort.x + (header.width + 45) * index;
      });

      const nodesInEachColumn: StickyNode[][] = [];

      colHeadersOriginalPosition.forEach((header) => {
        const headerYLow = header.y - 10;
        const headerYHigh = header.y + 10;
        const nodesInHeader: StickyNode[] = [];
        otherNodes.forEach((otherNode) => {
          if (otherNode.y <= headerYHigh && otherNode.y >= headerYLow) {
            nodesInHeader.push(otherNode);
          }
        });
        nodesInEachColumn.push(nodesInHeader);
      });

      nodesInEachColumn.forEach((nodesInColumn, index) => {
        nodesInColumn.forEach((nodeInColumn, nodeIndex) => {
          nodeInColumn.x = columnHeaders[index].x;
          nodeInColumn.y =
            columnHeaders[index].y +
            (nodeInColumn.height + 45) * (nodeIndex + 1);
        });
      });
    }
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};

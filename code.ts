figma.showUI(__html__);

type Position = {
  x: number;
  y: number;
};

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string; orientation: string }) => {
  if (msg.type === "orientation-swap") {
    const headerAxis = msg.orientation === "columns" ? "x" : "y";
    swapOrientation(figma.currentPage.selection, headerAxis);
  }

  figma.closePlugin();
};

/** Swap rows in `selectedNodes` to columns, or vice versa, based on `headerAxis`. */
function swapOrientation(
  selectedNodes: readonly SceneNode[],
  headerAxis: "x" | "y"
) {
  const currentViewPort = selectedNodes[0].absoluteBoundingBox;
  if (currentViewPort) {
    const headerAxisLow = currentViewPort[headerAxis] - 10;
    const headerAxisHigh = currentViewPort[headerAxis] + 10;
    const headers: SceneNode[] = [];
    const nonHeaderNodes: SceneNode[] = [];
    const headersOriginalPosition: Position[] = [];
    selectedNodes.forEach((node) => {
      if (
        node[headerAxis] <= headerAxisHigh &&
        node[headerAxis] >= headerAxisLow
      ) {
        headers.push(node);
        headersOriginalPosition.push({ x: node.x, y: node.y });
      } else {
        nonHeaderNodes.push(node);
      }
    });

    headers.forEach((header, index) => {
      if (headerAxis === "y") {
        header.y = currentViewPort.y + (header.height + 45) * index;
        header.x = currentViewPort.x;
      } else {
        header.y = currentViewPort.y;
        header.x = currentViewPort.x + (header.width + 45) * index;
      }
    });

    const nodesInEachHeader: SceneNode[][] = [];

    headersOriginalPosition.forEach((header) => {
      const headerOppositeEdge = headerAxis === "y" ? "x" : "y";
      const headerLow = header[headerOppositeEdge] - 10;
      const headerHigh = header[headerOppositeEdge] + 10;
      const nodesInHeader: SceneNode[] = [];
      nonHeaderNodes.forEach((nonHeaderNode) => {
        if (
          nonHeaderNode[headerOppositeEdge] <= headerHigh &&
          nonHeaderNode[headerOppositeEdge] >= headerLow
        ) {
          nodesInHeader.push(nonHeaderNode);
        }
      });
      nodesInEachHeader.push(nodesInHeader);
    });

    nodesInEachHeader.forEach((nodesInHeader, index) => {
      nodesInHeader.forEach((nodeInHeader, nodeIndex) => {
        if (headerAxis === "y") {
          nodeInHeader.x =
            headers[index].x + (nodeInHeader.width + 45) * (nodeIndex + 1);
          nodeInHeader.y = headers[index].y;
        } else {
          nodeInHeader.x = headers[index].x;
          nodeInHeader.y =
            headers[index].y + (nodeInHeader.height + 45) * (nodeIndex + 1);
        }
      });
    });
  }
}

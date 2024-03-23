figma.showUI(__html__);

type Position = {
  x: number;
  y: number;
};

/**
 * Calls to "parent.postMessage" from within the HTML page will trigger this callback.
 * The callback will be passed the "pluginMessage" property of the posted message.
 */
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
    const originalPositionHeaders: Position[] = [];
    selectedNodes.forEach((node) => {
      if (
        node[headerAxis] <= headerAxisHigh &&
        node[headerAxis] >= headerAxisLow
      ) {
        headers.push(node);
        originalPositionHeaders.push({ x: node.x, y: node.y });
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

    const nodesForEachHeader: SceneNode[][] = [];

    originalPositionHeaders.forEach((originalPositionHeader) => {
      const headerOppositeAxis = headerAxis === "y" ? "x" : "y";
      const headerOppositeAxisLow =
        originalPositionHeader[headerOppositeAxis] - 10;
      const headerOppositeAxisHigh =
        originalPositionHeader[headerOppositeAxis] + 10;
      const nodesForHeader: SceneNode[] = [];
      nonHeaderNodes.forEach((nonHeaderNode) => {
        if (
          nonHeaderNode[headerOppositeAxis] <= headerOppositeAxisHigh &&
          nonHeaderNode[headerOppositeAxis] >= headerOppositeAxisLow
        ) {
          nodesForHeader.push(nonHeaderNode);
        }
      });
      nodesForEachHeader.push(nodesForHeader);
    });

    nodesForEachHeader.forEach((nodesForHeader, headerIndex) => {
      nodesForHeader.forEach((nodeForHeader, nodeIndex) => {
        if (headerAxis === "y") {
          nodeForHeader.x =
            headers[headerIndex].x +
            (nodeForHeader.width + 45) * (nodeIndex + 1);
          nodeForHeader.y = headers[headerIndex].y;
        } else {
          nodeForHeader.x = headers[headerIndex].x;
          nodeForHeader.y =
            headers[headerIndex].y +
            (nodeForHeader.height + 45) * (nodeIndex + 1);
        }
      });
    });
  }
}

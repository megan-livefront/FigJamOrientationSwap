figma.showUI(__html__);

/** The axis the row/column headers stretch across, `x` if switching to columns, `y` if switching to rows. */
type HeaderAxis = "x" | "y";

/** The position of a node. */
type Position = {
  x: number;
  y: number;
};

/** Sorted arrays of nodes/positions from the current selection. */
type OrganizedNodes = {
  originalHeaderPositions: Position[];
  headers: SceneNode[];
  nonHeaderNodes: SceneNode[];
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

/**
 * Switch rows of `selectedNodes` to columns, or vice versa, based on `headerAxis`.
 * @param selectedNodes The currently selected nodes.
 * @param headerAxis HeaderAxis.
 * @returns OrganizedNodes.
 */
function swapOrientation(
  selectedNodes: readonly SceneNode[],
  headerAxis: HeaderAxis
) {
  const currentViewPort = selectedNodes[0].absoluteBoundingBox;
  if (currentViewPort) {
    const { originalHeaderPositions, headers, nonHeaderNodes } = organizeNodes(
      selectedNodes,
      headerAxis
    );

    repositionHeaders(headers, headerAxis, currentViewPort);

    const nodesForEachHeader = getNodesForEachHeader(
      originalHeaderPositions,
      nonHeaderNodes,
      headerAxis
    );

    repositionNonHeaderNodes(nodesForEachHeader, headers, headerAxis);
  }
}

/**
 * Returns an object containing an array of header positions before they're relocated, an array of header
 * nodes, and an array of all non-header nodes.
 * @param selectedNodes The currently selected nodes.
 * @param headerAxis HeaderAxis.
 * @returns OrganizedNodes.
 */
function organizeNodes(
  selectedNodes: readonly SceneNode[],
  headerAxis: HeaderAxis
): OrganizedNodes {
  const currentViewPort = selectedNodes[0].absoluteBoundingBox;
  if (!currentViewPort) throw new Error("No selected nodes!");

  const headers: SceneNode[] = [];
  const nonHeaderNodes: SceneNode[] = [];
  const originalHeaderPositions: Position[] = [];
  const headerAxisLow = currentViewPort[headerAxis] - 10;
  const headerAxisHigh = currentViewPort[headerAxis] + 10;

  selectedNodes.forEach((node) => {
    if (
      node[headerAxis] <= headerAxisHigh &&
      node[headerAxis] >= headerAxisLow
    ) {
      headers.push(node);
      originalHeaderPositions.push({ x: node.x, y: node.y });
    } else {
      nonHeaderNodes.push(node);
    }
  });

  return { originalHeaderPositions, headers, nonHeaderNodes };
}

/**
 * Move headers to appropriate position, based on `headerAxis`.
 * @param headers array of header nodes to reposition.
 * @param headerAxis HeaderAxis.
 * @param currentViewPort viewport of current selection.
 */
function repositionHeaders(
  headers: SceneNode[],
  headerAxis: HeaderAxis,
  currentViewPort: Rect
): void {
  headers.forEach((header, index) => {
    if (headerAxis === "y") {
      header.y = currentViewPort.y + (header.height + 45) * index;
      header.x = currentViewPort.x;
    } else {
      header.y = currentViewPort.y;
      header.x = currentViewPort.x + (header.width + 45) * index;
    }
  });
}

/**
 * Returns an array that contains an array of nodes for each of the headers.
 * @param originalHeaderPositions Original positions of each of the header nodes.
 * @param nonHeaderNodes Nodes that aren't a column/row header.
 * @param headerAxis HeaderAxis.
 * @returns SceneNode[]
 */
function getNodesForEachHeader(
  originalHeaderPositions: Position[],
  nonHeaderNodes: SceneNode[],
  headerAxis: HeaderAxis
): SceneNode[][] {
  const nodesForEachHeader: SceneNode[][] = [];

  originalHeaderPositions.forEach((originalHeaderPosition) => {
    const headerOppositeAxis = headerAxis === "y" ? "x" : "y";
    const headerOppositeAxisLow =
      originalHeaderPosition[headerOppositeAxis] - 10;
    const headerOppositeAxisHigh =
      originalHeaderPosition[headerOppositeAxis] + 10;
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

  return nodesForEachHeader;
}

/**
 * Repositions each non-header node within it's header row or column.
 * @param nodesForEachHeader Array that contains an array of nodes for each of the headers.
 * @param headers Array of header nodes.
 * @param headerAxis HeaderAxis.
 */
function repositionNonHeaderNodes(
  nodesForEachHeader: SceneNode[][],
  headers: SceneNode[],
  headerAxis: HeaderAxis
): void {
  nodesForEachHeader.forEach((nodesForHeader, headerIndex) => {
    nodesForHeader.forEach((nodeForHeader, nodeIndex) => {
      if (headerAxis === "y") {
        nodeForHeader.x =
          headers[headerIndex].x + (nodeForHeader.width + 45) * (nodeIndex + 1);
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

import { type ChildProcess } from "node:child_process";
/** Ordinary descendants only; trusted policies can deliberately escape the tree. */
export declare function terminateRotationTree(child: ChildProcess): Promise<void>;

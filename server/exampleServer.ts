import app from "./app";
import { Server } from "panoptyk-engine";

const PanoptykServer = new Server(app);

PanoptykServer.start();
import DxfArrayScanner, { IGroup } from "../DxfArrayScanner.js";
import * as helpers from "../ParseHelpers.js";
import IGeometry, { IEntity, IPoint } from "./geomtry.js";

// Helpful doc at https://atlight.github.io/formats/dxf-leader.html
// Codes at https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf

export interface ILeaderEntity extends IEntity {
    leaderStyleId: number; // 340
    // propertyOverrideFlag // 90
    leaderLineType: number; // 170
    leaderLineColor: number; // 91
    leaderLineTypeId: number; // 341
    leaderLineWeight: number; // 171
    enableLanding: boolean; // 290
    enableDogLeg: boolean; // 291
    doglegLength: number; // 41
    arrowHeadId: number; // 342
    arrowHeadSize: number; // 42
    contentType: number; // 172
    textStyleId: number; // 343
    textLeftAttachmentType: number; // 173
    textRightAttachmentType: number; // 95
    textAngleType: number; // 174
    textAlignmentType: number; // 175
    textColor: number; // 92
    enableFrameText: boolean; // 292
    blockContentId: number; // 344
    blockContentColor: number; // 93
    blockContentScale: IPoint; // 10
    blockContentRotation: number; // 43
    blockContentConnectionType: number; // 176
    enableAnotationScale: boolean; // 293
    arrowHeadIndex: number; // 94
    //arrowHeadId: number; // 345 - duplicate key in spec doc
    blockAttributeId: number; // 330
    blockAttributeIndex: number; // 177
    blockAttributeWidth: number; // 44
    blockAttributeTextString: string; // 302
    textDirectionNegative: boolean; // 294
    textAlignInIPE: number; // 178
    textAttachmentPoint: number; // 179
    textAttachmentDirectionMText: number; // 271
    textAttachmentDirectionBottom: number; // 272
    textAttachmentDirectionTop: number; // 273

    contextData: IMLeaderContextData; // 300
}

interface IMLeaderContextData {
    contentScale: number; // 40
    contentBasePosition: IPoint; // 10,20,30
    textHeight: number; // 41
    arrowHeadSize: number; // 140
    landingGap: number; // 145
    hasMText: boolean; // 290
    defaultTextContents: string; // 304
    textNormalDirection: IPoint; // 11,21,31
    textLocation: IPoint; // 12,22,32
    textDirection: IPoint; // 13,23,33
    textRotation: number; // 42
    textWidth: number; // 43
    // textHeight: number; // 44 - duplicate key in spec doc
    textLineSpacingFactor: number; // 45
    textLineSpacingStyle: number; // 170
    textColor: number; // 90
    textAttachment: number; // 171
    textFlowDirection: number; // 172
    textBackgroundColor: number; // 91
    textBackgroundScaleFactor: number; // 141
    textBackgroundTransparency: number; // 92
    textBackgroundColorOn: boolean; // 291
    textBackgroundFillOn: boolean; // 292
    textColumnType: number; // 173
    textUseAutoHeight: boolean; // 293
    textColumnWidth: number; // 142
    textColumnGutterWidth: number; // 143
    textColumnFlowReversed: boolean; // 294
    textColumnHeight: number; // 144
    textUseWordBreak: boolean; // 295
    hasBlock: boolean; // 296
    blockContentId: number; // 341
    blockContentNormalDirection: IPoint; // 14,24,34
    blockContentPosition: IPoint; // 15,25,35
    blockContentScale: number; // 16
    blockContentRotation: number; // 46
    blockContentColor: number; // 93
    blockTransformationMatrix: number[]; // 47
    planeOriginPoint: IPoint; // 110 (120,130)
    planeXAxisDirection: IPoint; // 111 (121,131)
    planeYAxisDirection: IPoint; // 112 (122,132)
    planeNormalReversed: boolean; // 297

    leaders: IMLeaderLeader[]; // 302
}

interface IMLeaderLeader {
    hasSetLastLeaderLinePoint: boolean; // 290
    hasSetDoglegVector: boolean; // 291
    lastLeaderLinePoint: IPoint; // 10,20,30
    doglegVector: IPoint; // 11,21,31
    // breakStartPoint // 12,22,32
    // breakEndPoint // 13,23,33
    leaderBranchIndex: number; // 90
    doglegLength: number; // 40

    leaderLines: IMLeaderLine[]; // 303
}

interface IMLeaderLine {
    vertices: IPoint[][]; // 10,20,30
    // breakPointIndex // 90,
    // breakStartPoint // 11,21,33
    // breakEndPoint // 12,22,32
    leaderLineIndex: number; // 91
}

export default class MLeader implements IGeometry {
    public ForEntityName = "MULTILEADER" as const;

    public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
        const entity = { type: curr.value } as ILeaderEntity;
        entity.contextData = {
            leaders: [],
        } as any;

        curr = scanner.next();

        function parseCommonData() {
            while (!scanner.isEOF()) {
                switch (curr.code) {
                    case 0: // END
                        return;
                    case 340:
                        entity.leaderStyleId = curr.value as number;
                        break;
                    case 170:
                        entity.leaderLineType = curr.value as number;
                        break;
                    case 91:
                        entity.leaderLineColor = curr.value as number;
                        break;
                    case 341:
                        entity.leaderLineTypeId = curr.value as number;
                        break;
                    case 171:
                        entity.leaderLineWeight = curr.value as number;
                        break;
                    case 41:
                        entity.doglegLength = curr.value as number;
                        break;
                    case 290:
                        entity.enableLanding = curr.value as boolean;
                        break;
                    case 291:
                        entity.enableDogLeg = curr.value as boolean;
                        break;
                    case 342:
                        entity.arrowHeadId = curr.value as number;
                        break;
                    case 42:
                        entity.arrowHeadSize = curr.value as number;
                        break;
                    case 172:
                        entity.contentType = curr.value as number;
                        break;
                    case 173:
                        entity.textLeftAttachmentType = curr.value as number;
                        break;
                    case 95:
                        entity.textLeftAttachmentType = curr.value as number;
                        break;
                    case 174:
                        entity.textAngleType = curr.value as number;
                        break;
                    case 175:
                        entity.textAlignmentType = curr.value as number;
                        break;
                    case 343:
                        entity.textStyleId = curr.value as number;
                        break;
                    case 92:
                        entity.textColor = curr.value as number;
                        break;
                    case 292:
                        entity.enableFrameText = curr.value as boolean;
                        break;
                    case 344:
                        entity.blockContentId = curr.value as number;
                        break;
                    case 93:
                        entity.blockContentColor = curr.value as number;
                        break;
                    case 10:
                        entity.blockContentScale = helpers.parsePoint(scanner);
                        break;
                    case 43:
                        entity.blockContentRotation = curr.value as number;
                        break;
                    case 176:
                        entity.blockContentConnectionType =
                            curr.value as number;
                        break;
                    case 293:
                        entity.enableAnotationScale = curr.value as boolean;
                        break;
                    case 94:
                        entity.arrowHeadIndex = curr.value as number;
                        break;
                    case 330:
                        entity.blockAttributeId = curr.value as number;
                        break;
                    case 177:
                        entity.blockAttributeIndex = curr.value as number;
                        break;
                    case 44:
                        entity.blockAttributeWidth = curr.value as number;
                        break;
                    case 302:
                        entity.blockAttributeTextString = curr.value as string;
                        break;
                    case 294:
                        entity.textDirectionNegative = curr.value as boolean;
                        break;
                    case 178:
                        entity.textAlignInIPE = curr.value as number;
                        break;
                    case 179:
                        entity.textAttachmentPoint = curr.value as number;
                        break;
                    case 271:
                        entity.textAttachmentDirectionMText =
                            curr.value as number;
                        break;
                    case 272:
                        entity.textAttachmentDirectionBottom =
                            curr.value as number;
                        break;
                    case 273:
                        entity.textAttachmentDirectionTop =
                            curr.value as number;
                        break;

                    case 300: // START CONTEXT_DATA
                        parseContextData();
                        break;
                    default:
                        helpers.checkCommonEntityProperties(
                            entity,
                            curr,
                            scanner
                        );
                        break;
                }
                curr = scanner.next();
            }
        }

        function parseContextData() {
            while (!scanner.isEOF()) {
                switch (curr.code) {
                    case 40:
                        entity.contextData.contentScale = curr.value as number;
                        break;
                    case 10:
                        entity.contextData.contentBasePosition =
                            helpers.parsePoint(scanner);
                        break;
                    case 145:
                        entity.contextData.landingGap = curr.value as number;
                        break;
                    case 290:
                        entity.contextData.hasMText = curr.value as boolean;
                        break;
                    case 304:
                        entity.contextData.defaultTextContents =
                            curr.value as string;
                        break;
                    case 11:
                        entity.contextData.textNormalDirection =
                            helpers.parsePoint(scanner);
                        break;
                    case 12:
                        entity.contextData.textLocation =
                            helpers.parsePoint(scanner);
                        break;
                    case 13:
                        entity.contextData.textDirection =
                            helpers.parsePoint(scanner);
                        break;
                    case 140:
                        entity.contextData.arrowHeadSize = curr.value as number;
                        break;
                    case 41:
                        entity.contextData.textHeight = curr.value as number;
                        break;
                    case 42:
                        entity.contextData.textRotation = curr.value as number;
                        break;
                    case 43:
                        entity.contextData.textWidth = curr.value as number;
                        break;
                    case 44:
                        entity.contextData.textHeight = curr.value as number;
                        break;
                    case 45:
                        entity.contextData.textLineSpacingFactor =
                            curr.value as number;
                        break;
                    case 90:
                        entity.contextData.textColor = curr.value as number;
                        break;
                    case 170:
                        entity.contextData.textLineSpacingStyle =
                            curr.value as number;
                        break;
                    case 171:
                        entity.contextData.textAttachment =
                            curr.value as number;
                        break;
                    case 172:
                        entity.contextData.textFlowDirection =
                            curr.value as number;
                        break;
                    case 141:
                        entity.contextData.textBackgroundScaleFactor =
                            curr.value as number;
                        break;
                    case 92:
                        entity.contextData.textBackgroundTransparency =
                            curr.value as number;
                        break;
                    case 291:
                        entity.contextData.textBackgroundColorOn =
                            curr.value as boolean;
                        break;
                    case 292:
                        entity.contextData.textBackgroundFillOn =
                            curr.value as boolean;
                        break;
                    case 293:
                        entity.contextData.textUseAutoHeight =
                            curr.value as boolean;
                        break;
                    case 173:
                        entity.contextData.textColumnType =
                            curr.value as number;
                        break;
                    case 142:
                        entity.contextData.textColumnWidth =
                            curr.value as number;
                        break;
                    case 143:
                        entity.contextData.textColumnGutterWidth =
                            curr.value as number;
                        break;
                    case 144:
                        entity.contextData.textColumnHeight =
                            curr.value as number;
                        break;
                    case 295:
                        entity.contextData.textUseWordBreak =
                            curr.value as boolean;
                        break;
                    case 296:
                        entity.contextData.hasBlock = curr.value as boolean;
                        break;
                    case 341:
                        entity.contextData.blockContentId =
                            curr.value as number;
                        break;
                    case 14:
                        entity.contextData.blockContentNormalDirection =
                            helpers.parsePoint(scanner);
                        break;
                    case 15:
                        entity.contextData.blockContentPosition =
                            helpers.parsePoint(scanner);
                        break;
                    case 16:
                        entity.contextData.blockContentScale =
                            curr.value as number;
                        break;
                    case 46:
                        entity.contextData.blockContentRotation =
                            curr.value as number;
                        break;
                    case 93:
                        entity.contextData.blockContentColor =
                            curr.value as number;
                        break;
					case 47:
						entity.contextData.blockTransformationMatrix = helpers.parseMatrix(scanner, 47);
						break;
                    case 110:
                        entity.contextData.planeOriginPoint =
                            helpers.parsePoint(scanner);
                        break;
                    case 111:
                        entity.contextData.planeXAxisDirection =
                            helpers.parsePoint(scanner);
                        break;
                    case 112:
                        entity.contextData.planeYAxisDirection =
                            helpers.parsePoint(scanner);
                        break;
                    case 297:
                        entity.contextData.planeNormalReversed =
                            curr.value as boolean;
                        break;
                    case 301: // END CONTEXT_DATA
                        return;
                    case 302: // START LEADER
                        parseLeaderData();
                        break;
                    default:
                        break;
                }

                curr = scanner.next();
            }
        }

        function parseLeaderData() {
            const leader = {
                leaderLines: [],
            } as any as IMLeaderLeader;

            entity.contextData.leaders.push(leader);

            while (!scanner.isEOF()) {
                switch (curr.code) {
                    case 290:
                        leader.hasSetLastLeaderLinePoint =
                            curr.value as boolean;
                        break;
                    case 291:
                        leader.hasSetDoglegVector = curr.value as boolean;
                        break;
                    case 10:
                        leader.lastLeaderLinePoint =
                            helpers.parsePoint(scanner);
                        break;
                    case 11:
                        leader.doglegVector = helpers.parsePoint(scanner);
                        break;
                    case 90:
                        leader.leaderBranchIndex = curr.value as number;
                        break;
                    case 40:
                        leader.doglegLength = curr.value as number;
                        break;
                    case 303: // END LEADER
                        return;
                    case 304: // START LEADER_LINE
                        parseLeaderLineData();
                        break;
                    default:
                        break;
                }

                curr = scanner.next();
            }
        }

        function parseLeaderLineData() {
            const leader =
                entity.contextData.leaders[
                    entity.contextData.leaders.length - 1
                ];
            const line = {
                vertices: [[]],
            } as any as IMLeaderLine;
            leader.leaderLines.push(line);

            while (!scanner.isEOF()) {
                switch (curr.code) {
                    case 10:
                        line.vertices[0].push(helpers.parsePoint(scanner));
                        break;
                    case 305: // END LEADER_LINE
                        return;
                    default:
                        break;
                }

                curr = scanner.next();
            }
        }

        parseCommonData();

        return entity;
    }
}

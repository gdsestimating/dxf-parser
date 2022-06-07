import DxfArrayScanner, { IGroup } from '../DxfArrayScanner.js';
import * as helpers from '../ParseHelpers.js';
import IGeometry, { IEntity, IPoint } from './geomtry.js';

export interface ILeaderEntity extends IEntity{
	// leaderStyleId // 340
	// propertyOverrideFlag // 90
	leaderLineType: number // 170
	// leaderLineColor // 91
	// leaderLineTypeId // 341
	// leaderLineWeight // 171
	enableLanding: boolean, // 290
	enableDogLeg: boolean, // 291
	doglegLength: number, // 41
	// arrowHeadId // 342
	// arrowHeadSize // 42
	// contentType // 172
	// textStyleId // 343
	// textLeftAttachmentType // 173
	// textRightAttachmentType // 95
	// textAngleType // 174
	// textAlignmentType // 175
	// textColor // 92
	// enableFrameText: boolean, // 292
	// blockContentId // 344
	// blockContentColor // 93
	// blockContentScale: IPoint, // 10
	// blockContentRotation // 43
	// blockContentConnectionType // 176
	// enableAnotationScale: boolean, // 293
	// arrowHeadIndex:number, // 94
	// arrowHeadId // 345
	// blockAttributeId // 330
	// blockAttributeIndex // 177
	// blockAttributeWidth // 44
	// blockAttributeTextString: string, // 302
	// textDirectionNegative: boolean, // 294
	// textAlignInIPE // 178
	// textAttachmentPoint // 179
	// textAttachmentDirectionMText // 271
	// textAttachmentDirectionBottom // 272
	// textAttachmentDirectionTop // 273

	contextData: {
		contentScale: number, // 40
		contentBasePosition: IPoint, // 10,20,30
		textHeight: number, // 41
		// arrowHeadSize // 140
		// landingGap // 145
		// hasMText // 290
		// defaultTextContents // 304
		// textNormalDirection // 11,21,31
		// textLocation // 12,22,32
		// textDirection // 13,23,33
		textRotation: number, // 42
		textWidth: number, // 43
		//textHeight: number // 44
		// textLineSpacingFactor // 45
		// textLineSpacingStyle // 170
		// textColor // 90
		// textAttachment // 171
		// textFlowDirection // 172
		// textBackgroundColor // 91
		// textBackgroundScaleFactor // 141
		// textBackgroundTransparency // 92
		// textBackgroundColorOn // 291
		// textBackgroundFillOn // 292
		// textColumnType // 143
		// textUseAutoHeight // 293
		// textColumnWidth // 142
		// textColumnGutterWidth // 143
		// textColumnFlowReversed // 294
		// textColumnHeight // 144
		// textUseWordBreak // 295
		// hasBlock // 296
		// blockContentId // 341
		// blockContentNormalDirection // 14,24,34
		// blockContentPosition // 15,25,35
		// blockContentScale // 16
		// blockContentRotation // 46
		// blockContentColor // 93
		// blockTransformationMatrix // 47
		// planeOriginPoint // 110
		// planeXAxisDirection // 111
		// planeYAxisDirection // 112
		// planeNormalReversed // 297
		// vertex // 10,20,30
		// breakPointIndex // 90

		leaders: {
			// hasSetLastLeaderLinePoint // 290
			// hasSetDoglegVector // 291
			// lastLeaderLinePoint // 10,20,30
			// doglegVector // 11,21,31
			// breakStartPoint // 12,22,32
			// breakEndPoint // 13,23,33
			// leaderBranchIndex // 90
			// doglegLength // 40
			
			leaderLine:
			{
				vertices: IPoint[], // 10,20,30
				// breakPointIndex // 90,
				// breakStartPoint // 11,21,33
				// breakEndPoint // 12,22,32
				// leaderLineIndex // 91
			}
		}[]
	}
}

// Helpful doc at https://atlight.github.io/formats/dxf-leader.html
// Codes at https://images.autodesk.com/adsk/files/autocad_2012_pdf_dxf-reference_enu.pdf
export default class MLeader implements IGeometry {
	public ForEntityName = 'MULTILEADER' as const;

	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		console.info("START LEADER ----");
		const entity = { type: curr.value } as ILeaderEntity;
		entity.contextData = {
			leaders: []
		} as any;

		curr = scanner.next();

		function parseCommonData() {
			while(!scanner.isEOF()) {

				switch(curr.code) {
					case 0: // END
						return;
					case 40:
						entity.doglegLength = curr.value as number;
						break;
					case 170: 
						entity.leaderLineType = curr.value as number;
						break;
					case 290:
						entity.enableLanding = curr.value as boolean;
						break;
					case 291:
						entity.enableDogLeg = curr.value as boolean;
						break; 
					case 300: // START CONTEXT_DATA	
						parseContextData();			
						break;
					default:
						console.log("common "+curr.code+"="+curr.value);
						helpers.checkCommonEntityProperties(entity, curr, scanner);
						break;
				}
				curr = scanner.next();
			}
		}

		function parseContextData() {
			while (!scanner.isEOF()) {
				switch(curr.code) {
					case 40:
						entity.contextData.contentScale = curr.value as number;
						break;
					case 10:
						entity.contextData.contentBasePosition = helpers.parsePoint(scanner);
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

					case 301: // END CONTEXT_DATA
						return;

					case 302: // START LEADER
						parseLeaderData();
						break;

					default:
						console.log("context "+curr.code+"="+curr.value);
						break;
				}

				curr = scanner.next();
			}
			
		}

		function parseLeaderData() {
			while (!scanner.isEOF()) {
				switch(curr.code) {
					case 303: // END LEADER
						return;
					case 304: // START LEADER_LINE
						parseLeaderLineData();
						break;
					default:
						console.log("leader "+curr.code+"="+curr.value);
						break;
				}
				
				curr = scanner.next();
			}
		}

		function parseLeaderLineData() {
			while (!scanner.isEOF()) {
				switch(curr.code) {
					case 305: // END LEADER_LINE
						return;
					default:
						console.log("line "+curr.code+"="+curr.value);
						break;
				}
				
				curr = scanner.next();
			}
		}

		parseCommonData();
		
		return entity;
	}
}

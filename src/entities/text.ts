
import DxfArrayScanner, { IGroup } from '../DxfArrayScanner';
import * as helpers from '../ParseHelpers'
import IGeometry, { IEntity, IPoint } from './geomtry';

export interface ITextEntity extends IEntity {
	startPoint: IPoint;
	endPoint: IPoint;
	textHeight: number;
	xScale: number;
	rotation: number;
	text: string;
	halign: number;
	valign: number;
}

export default class Text implements IGeometry {
	public ForEntityName = 'TEXT' as const;
	public parseEntity(scanner: DxfArrayScanner, curr: IGroup) {
		const entity = { type: curr.value } as ITextEntity;
		curr = scanner.next();
		while (!scanner.isEOF()) {
			if (curr.code === 0) break;
			switch (curr.code) {
				case 10: // X coordinate of 'first alignment point'
					entity.startPoint = helpers.parsePoint(scanner);
					break;
				case 11: // X coordinate of 'second alignment point'
					entity.endPoint = helpers.parsePoint(scanner);
					break;
				case 40: // Text height
					entity.textHeight = curr.value as number;
					break;
				case 41:
					entity.xScale = curr.value as number;
					break;
				case 50: // Rotation in degrees
					entity.rotation = curr.value as number;
					break;
				case 1: // Text
					entity.text = curr.value as string;
					break;
				// NOTE: 72 and 73 are meaningless without 11 (second alignment point)
				case 72: // Horizontal alignment
					entity.halign = curr.value as number;
					break;
				case 73: // Vertical alignment
					entity.valign = curr.value as number;
					break;
				default: // check common entity attributes
					helpers.checkCommonEntityProperties(entity, curr, scanner);
					break;
			}
			curr = scanner.next();
		}
		return entity;
	}
}

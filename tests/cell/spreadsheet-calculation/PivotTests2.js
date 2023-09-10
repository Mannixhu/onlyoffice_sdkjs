/*
 * (c) Copyright Ascensio System SIA 2010-2023
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */
QUnit.config.autostart = false;
$(function() {
	let documents = {
		"test_formats": Asc.test_formats,
		"test_formats_redo": Asc.test_formats_redo,
		"test_formats2": Asc.test_formats,
		"test_formats2_redo": Asc.test_formats_redo,
	}
	let files = {};
	let api = new Asc.spreadsheet_api({
		'id-view': 'editor_sdk'
	});
	api.FontLoader = {
		LoadDocumentFonts: function() {
		}
	};
	api.collaborativeEditing = new AscCommonExcel.CCollaborativeEditing({});
	window["Asc"]["editor"] = api;

	waitLoadModules(function(){
		AscCommon.g_oTableId.init();
		api._onEndLoadSdk();
		startTests();
	});
	function waitLoadModules(waitCallback) {
		Asc.spreadsheet_api.prototype._init = function() {
			this._loadModules();
		};
		Asc.spreadsheet_api.prototype._loadFonts = function(fonts, callback) {
			callback();
		};
		Asc.spreadsheet_api.prototype.onEndLoadFile = function(fonts, callback) {
			waitCallback();
		};
		AscCommonExcel.WorkbookView.prototype._calcMaxDigitWidth = function() {
		};
		AscCommonExcel.WorkbookView.prototype._init = function() {
		};
		AscCommonExcel.WorkbookView.prototype._onWSSelectionChanged = function() {
		};
		AscCommonExcel.WorkbookView.prototype.showWorksheet = function() {
		};
		AscCommonExcel.WorksheetView.prototype._init = function() {
		};
		AscCommonExcel.WorksheetView.prototype.updateRanges = function() {
		};
		AscCommonExcel.WorksheetView.prototype._autoFitColumnsWidth = function() {
		};
		AscCommonExcel.WorksheetView.prototype.setSelection = function() {
		};
		AscCommonExcel.WorksheetView.prototype.draw = function() {
		};
		AscCommonExcel.WorksheetView.prototype._prepareDrawingObjects = function() {
		};
		AscCommon.baseEditorsApi.prototype._onEndLoadSdk = function() {
		};
	}
	function openDocument(file){
		if (api.wbModel) {
			api.asc_CloseFile();
		}

		api.isOpenOOXInBrowser = false;
		api.openingEnd.xlsx = true;
		api.openingEnd.data = AscCommon.Base64.decode(file["Editor.xlsx"]);
		api._openDocument(AscCommon.Base64.decode(file["Editor.bin"]));
		api.wb = new AscCommonExcel.WorkbookView(api.wbModel, api.controller, api.handlers, api.HtmlElement,
			api.topLineEditorElement, api, api.collaborativeEditing, api.fontRenderingMode);
		return api.wbModel;
	}
	function prepareTest(assert, wb){
		api.wb.model = wb;
		api.wbModel = wb;
		api.initGlobalObjects(wb);
		api.handlers.remove("getSelectionState");
		api.handlers.add("getSelectionState", function () {
			return null;
		});
		api.handlers.remove("asc_onError");
		api.handlers.add("asc_onError", function (code, level) {
			assert.equal(code, 0, "asc_onError");
		});
		AscCommon.History.Clear();
	}
	let memory = new AscCommon.CMemory();
	function Utf8ArrayToStr(array) {
		let out, i, len, c;
		let char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while(i < len) {
			c = array[i++];
			switch(c >> 4)
			{
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
				// 0xxxxxxx
				out += String.fromCharCode(c);
				break;
				case 12: case 13:
				// 110x xxxx   10xx xxxx
				char2 = array[i++];
				out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
				break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = array[i++];
					char3 = array[i++];
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2 & 0x3F) << 6) |
						((char3 & 0x3F) << 0));
					break;
			}
		}

		return out;
	}
	function getXml(pivot, addCacheDefinition){
		memory.Seek(0);
		pivot.toXml(memory);
		if(addCacheDefinition) {
			memory.WriteXmlString('\n\n');
			pivot.cacheDefinition.toXml(memory);
		}
		let buffer = new Uint8Array(memory.GetCurPosition());
		for (let i = 0; i < memory.GetCurPosition(); i++)
		{
			buffer[i] = memory.data[i];
		}
		if(typeof TextDecoder !== "undefined") {
			return new TextDecoder("utf-8").decode(buffer);
		} else {
			return Utf8ArrayToStr(buffer);
		}

	}
	function checkHistoryOperation(assert, pivot, valuesUndo, valuesRedo, message, action, check) {
		let ws = pivot.GetWS();
		let wb = ws.workbook;
		let xmlUndo = getXml(pivot, false);
		let pivotStart = pivot.clone();
		pivotStart.Id = pivot.Get_Id();

		AscCommon.History.Create_NewPoint();
		AscCommon.History.StartTransaction();
		action();
		AscCommon.History.EndTransaction();
		pivot = wb.getPivotTableById(pivot.Get_Id());
		check(assert, pivot, valuesRedo, message);
		let xmlDo = getXml(pivot, true);
		let changes = wb.SerializeHistory();

		AscCommon.History.Undo();
		pivot = wb.getPivotTableById(pivot.Get_Id());
		check(assert, pivot, valuesUndo, message + "_undo");
		assert.strictEqual(getXml(pivot, false), xmlUndo, message + "_undo_xml");

		AscCommon.History.Redo();
		pivot = wb.getPivotTableById(pivot.Get_Id());
		check(assert, pivot, valuesRedo, message + "_redo");
		assert.strictEqual(getXml(pivot, true), xmlDo, message + "_redo_xml");

		AscCommon.History.Undo();
		ws.deletePivotTable(pivot.Get_Id());
		pivot = pivotStart;
		ws.insertPivotTable(pivot, false, false);
		wb.DeserializeHistory(changes);
		pivot = wb.getPivotTableById(pivot.Get_Id());
		check(assert, pivot, valuesRedo, message + "_changes");
		assert.strictEqual(getXml(pivot, true), xmlDo, message + "_changes_xml");
		return pivot;
	}
	function getReportValues(pivot) {
		let res = [];
		let range = new AscCommonExcel.MultiplyRange(pivot.getReportRanges()).getUnionRange();
		pivot.GetWS().getRange3(range.r1, range.c1, range.r2, range.c2)._foreach(function(cell, r, c, r1, c1) {
			if (!res[r - r1]) {
				res[r - r1] = [];
			}
			res[r - r1][c - c1] = cell.getName() + ":" + cell.getValue();
		});
		return res;
	}
	function getReportValuesWithBoolFill(pivot) {
		let res = [];
		let range = new AscCommonExcel.MultiplyRange(pivot.getReportRanges()).getUnionRange();
		pivot.GetWS().getRange3(range.r1, range.c1, range.r2, range.c2)._foreach(function(cell, r, c, r1, c1) {
			if (!res[r - r1]) {
				res[r - r1] = [];
			}
			res[r - r1][c - c1] = cell.getName() + ":" + cell.getValue()+ ":" + !!(cell.getStyle() && !cell.getStyle().isNormalFill());
		});
		return res;
	}

	QUnit.module("Pivot");

	function startTests() {
		QUnit.start();

		QUnit.test('Test: refresh test_formats[Bug with subtotals (Excel 2019)]', function (assert) {
			let file = Asc.test_formats;
			let fileRedo = Asc.test_formats_redo;
			let wsName = "Bug with subtotals (Excel 2019)";
			let row = 2;
			let col = 0;
			let getValues = getReportValues;

			let wbRedo = openDocument(fileRedo);
			let pivotRedo = wbRedo.getWorksheetByName(wsName).getPivotTable(col, row);
			let valuesRedo = getValues(pivotRedo);

			let wb = openDocument(file);
			let pivot = wb.getWorksheetByName(wsName).getPivotTable(col, row);
			let values = getValues(pivot);

			prepareTest(assert, wb);
			pivot = checkHistoryOperation(assert, pivot, values, valuesRedo, "refresh", function(){
				pivot.asc_refresh(api);
			}, function(assert, pivot, values, message) {
				assert.deepEqual(getValues(pivot), values, message);
			});
		});

		QUnit.test('Test: refresh test_formats check values and format', function (assert) {
			let file = Asc.test_formats;
			let fileRedo = Asc.test_formats_redo;
			let wsNames = ["Subtotal offset",
				"Label offset",
				"Data area",
				"Bug with subtotals (Excel 2019)",
				"Grand offset",
				"tabular offset test",
				"All test"];
			let row = 2;
			let col = 0;
			let getValues = getReportValuesWithBoolFill;

			function prepareValues(wb, name, row, col){
				let pivot = wb.getWorksheetByName(name).getPivotTable(col, row);
				return getValues(pivot);
			}
			function preparePivots(wb, name, row, col){
				return wb.getWorksheetByName(name).getPivotTable(col, row);
			}

			let wbRedo = openDocument(fileRedo);
			let valuesRedo = wsNames.map(function(name){
				return prepareValues(wbRedo, name, row, col);
			});

			let wb = openDocument(file);
			let valuesUndo = wsNames.map(function(name){
				return prepareValues(wb, name, row, col);
			});
			let pivots = wsNames.map(function(name){
				return preparePivots(wb, name, row, col);
			});

			prepareTest(assert, wb);
			wsNames.forEach(function(name, index){
				let pivot = pivots[index];
				pivot = checkHistoryOperation(assert, pivot, valuesUndo[index], valuesRedo[index], "refresh[" + name + "]", function(){
					pivot.asc_refresh(api);
				}, function(assert, pivot, values, message) {
					assert.deepEqual(getValues(pivot), values, message);
				});
			});
		});
	}
});

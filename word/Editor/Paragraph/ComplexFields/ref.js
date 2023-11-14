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
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
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

"use strict";

(function(window)
{
	const FLAG_H = 0x01;
	const FLAG_N = 0x02;
	const FLAG_W = 0x04;
	const FLAG_R = 0x08;
	const FLAG_P = 0x10;
	
	/**
	 * REF field
	 * @constructor
	 */
	function FieldInstructionREF()
	{
		AscWord.FieldInstructionBase.call(this);
		
		this.BookmarkName = "";
		this.Delimiter    = null;
		this.flags        = 0x00;
	}
	FieldInstructionREF.prototype = Object.create(AscWord.FieldInstructionBase.prototype);
	FieldInstructionREF.prototype.constructor = FieldInstructionREF;
	FieldInstructionREF.prototype.Type = AscWord.fieldtype_REF;
	
	FieldInstructionREF.prototype.SetBookmarkName = function(sBookmarkName)
	{
		this.BookmarkName = sBookmarkName;
	};
	FieldInstructionREF.prototype.GetBookmarkName = function()
	{
		return this.BookmarkName;
	};
	FieldInstructionREF.prototype.SetHyperlink = function(isHyperlink)
	{
		if (isHyperlink)
			this.flags |= FLAG_H;
		else
			this.flags &= ~FLAG_H;
	};
	FieldInstructionREF.prototype.GetHyperlink = function()
	{
		return !!(this.flags & FLAG_H);
	};
	FieldInstructionREF.prototype.SetIsNumberNoContext = function(bVal)
	{
		if (bVal)
			this.flags |= FLAG_N;
		else
			this.flags &= ~FLAG_N;
	};
	FieldInstructionREF.prototype.IsNumberNoContext = function()
	{
		return !!(this.flags & FLAG_N);
	};
	FieldInstructionREF.prototype.SetIsNumberFullContext = function(bVal)
	{
		if (bVal)
			this.flags |= FLAG_W;
		else
			this.flags &= ~FLAG_W;
	};
	FieldInstructionREF.prototype.IsNumberFullContext = function()
	{
		return !!(this.flags & FLAG_W);
	};
	FieldInstructionREF.prototype.HaveNumberFlag = function()
	{
		return this.IsNumber() || this.IsNumberFullContext() || this.IsNumberNoContext();
	};
	FieldInstructionREF.prototype.SetIsNumber = function(bVal)
	{
		if (bVal)
			this.flags |= FLAG_R;
		else
			this.flags &= ~FLAG_R;
	};
	FieldInstructionREF.prototype.IsNumber = function()
	{
		return !!(this.flags & FLAG_R);
	};
	FieldInstructionREF.prototype.SetIsPosition = function(bVal)
	{
		if (bVal)
			this.flags |= FLAG_P;
		else
			this.flags &= ~FLAG_P;
	};
	FieldInstructionREF.prototype.IsPosition = function()
	{
		return !!(this.flags & FLAG_P);
	};
	FieldInstructionREF.prototype.SetDelimiter = function(bVal)
	{
		this.Delimiter = bVal;
	};
	FieldInstructionREF.prototype.GetDelimiter = function()
	{
		return this.Delimiter;
	};
	//------------------------------------------------------------------------------------------------------------------
	// Methods for compatibility with ParaHyperlink
	//------------------------------------------------------------------------------------------------------------------
	FieldInstructionREF.prototype.GetAnchor = function()
	{
		var sBookmarkName = this.GetBookmarkName();
		var sAnchor = sBookmarkName;
		if(this.ComplexField)
		{
			var oLogicDoc = this.ComplexField.LogicDocument;
			if(oLogicDoc)
			{
				var oBookmarksManager = oLogicDoc.GetBookmarksManager();
				if(oBookmarksManager)
				{
					var oBookmark = oBookmarksManager.GetBookmarkByName(sBookmarkName);
					if(!oBookmark)
					{
						sAnchor = "_top";
					}
				}
			}
		}
		return sAnchor;
	};
	FieldInstructionREF.prototype.GetValue = function()
	{
		return "";
	};
	FieldInstructionREF.prototype.SetVisited = function(isVisited)
	{
	};
	/**
	 * Проверяем является ли данная ссылка ссылкой в начало документа
	 * @returns {boolean}
	 */
	FieldInstructionREF.prototype.IsTopOfDocument = function()
	{
		return (this.GetAnchor() === "_top");
	};
	FieldInstructionREF.prototype.SetToolTip = function(sToolTip)
	{
	};
	FieldInstructionREF.prototype.GetToolTip = function()
	{
		var sTooltip = this.BookmarkName;
		if(!sTooltip || '_' === sTooltip.charAt(0))
		{
			sTooltip = AscCommon.translateManager.getValue("Current Document");
		}
		return sTooltip;
	};
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private area
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	FieldInstructionREF.prototype.writeField = function()
	{
		let result = " REF ";
		result += this.BookmarkName;
		
		if (this.GetHyperlink())
			result += " \\h";
		
		if (this.IsNumber())
			result += " \\r"
		else if (this.IsNumberNoContext())
			result += " \\n";
		else if (this.IsNumberFullContext())
			result += " \\w";
		
		if (this.IsPosition())
			result += " \\p";
		
		if (typeof this.Delimiter === "string" && this.Delimiter.length > 0)
			result += " \\d " + this.Delimiter;
		
		return result;
	};
	//--------------------------------------------------------export----------------------------------------------------
	window['AscWord'] = window['AscWord'] || {};
	window['AscWord'].FieldInstructionREF = FieldInstructionREF;
	
})(window);

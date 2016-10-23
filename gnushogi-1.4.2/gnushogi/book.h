/*
 * FILE: book.h
 *
 * ----------------------------------------------------------------------
 * Copyright (c) 1993, 1994, 1995 Matthias Mutz
 * Copyright (c) 1999 Michael Vanier and the Free Software Foundation
 * Copyright (c) 2008, 2013, 2014 Yann Dirson and the Free Software Foundation
 *
 * GNU SHOGI is based on GNU CHESS
 *
 * Copyright (c) 1988, 1989, 1990 John Stanback
 * Copyright (c) 1992 Free Software Foundation
 *
 * This file is part of GNU SHOGI.
 *
 * GNU Shogi is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License,
 * or (at your option) any later version.
 *
 * GNU Shogi is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with GNU Shogi; see the file COPYING. If not, see
 * <http://www.gnu.org/licenses/>.
 * ----------------------------------------------------------------------
 *
 */

#ifndef _BOOK_H_
#define _BOOK_H_

struct gdxadmin
{
    ULONG bookcount;
    ULONG booksize;
    ULONG maxoffset;
};

extern struct gdxadmin B;


#define GOODMOVE 0x1000
#define BADMOVE  0x0100
#define LASTMOVE 0x0010

struct gdxdata
{
    ULONG  hashbd;
    USHORT hashkey;
    USHORT bmove;
    USHORT flags; /* flags BADMOVE, GOODMOVE,  LASTMOVE */
    USHORT hint;
    USHORT count;
};


#define sizeof_gdxadmin sizeof(struct gdxadmin)
#define sizeof_gdxdata  sizeof(struct gdxdata)

#endif /* _BOOK_H_ */


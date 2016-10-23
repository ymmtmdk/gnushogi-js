/*
 * FILE: pattern.c
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

#include "gnushogi.h"
#include "pattern.h"

/* "pat2inc" generates constants and pattern_data */
#include "pattern.inc"

struct Pattern_rec Pattern[MAX_PATTERN];
struct OpeningSequence_rec OpeningSequence[MAX_OPENING_SEQUENCE];

small_short pattern_data[MAX_PATTERN_DATA];


static void
NameOfOpeningValue (short i, char *name)
{
    if (i < 100)
    {
        strcpy(name, "CASTLE_?_?");
    }
    else
    {
        strcpy(name, "ATTACK_?_?");
        i -= 100;
    }

    switch (i / 10)
    {
    case 1:
        name[7] = 'S';
        break;

    case 2:
        name[7] = 'R';
        break;

    case 3:
        name[7] = 'U';
        break;

    default:
        name[7] = '*';
        break;
    }

    switch (i % 10)
    {
    case 1:
        name[9] = 'S';
        break;

    case 2:
        name[9] = 'R';
        break;

    case 3:
        name[9] = 'U';
        break;

    default:
        name[9] = '*';
        break;
    }
}


void
GetOpeningPatterns (short *max_opening_sequence)
{
    short pindex = 0;
    short os = 0;
    short p = 0;
    short i;

    do
    {
        OpeningSequence[os].opening_type = pattern_data[pindex++];
        OpeningSequence[os].first_pattern[0] = p;

        for (i = 1; i < MAX_SEQUENCE; i++)
            OpeningSequence[os].first_pattern[i] = END_OF_PATTERNS;

        do
        {
            Pattern[p].reachedGameCnt[black] = MAXMOVES;
            Pattern[p].reachedGameCnt[white] = MAXMOVES;
            Pattern[p].first_link = pindex;

            while (pattern_data[pindex] != END_OF_LINKS)
                pindex++;
            pindex++;

            Pattern[p].first_field = pindex;

            while (pattern_data[pindex] != END_OF_FIELDS)
                pindex += 2;
            pindex++;

            if (pattern_data[pindex] != END_OF_PATTERNS)
                Pattern[p].next_pattern = p + 1;
            else
                Pattern[p].next_pattern = END_OF_PATTERNS;

            p++;
        }
        while (pattern_data[pindex] != END_OF_PATTERNS);

        pindex++;
        os++;
    }
    while (pattern_data[pindex] != END_OF_SEQUENCES);

    *max_opening_sequence = os;
}



void
ShowOpeningPatterns (short max_opening_sequence)
{
    short os, p, n, i;

    for (os = 0; os < max_opening_sequence; os++)
    {
        char name[16];
        NameOfOpeningValue(OpeningSequence[os].opening_type, name);
        printf("Opening Type: %s\n", name);

        for (p = OpeningSequence[os].first_pattern[0], n = 0;
             p != END_OF_PATTERNS;
             p = Pattern[p].next_pattern, n++)
        {
            printf("Pattern %d (%d) with links ", p, n);

            for (i = Pattern[p].first_link;
                 pattern_data[i] != END_OF_LINKS;
                 i++)
            {
                printf("%d ", pattern_data[i]);
            }

            printf("\n");
            DisplayPattern(stdout, Pattern[p].first_field);
        }
    }
}



void
set_field (short i, struct PatternField *field)
{
    field->piece  = pattern_data[i];
    field->square = pattern_data[i+1];

    if (field->square < 0)
    {
        field->square = -(field->square);
        field->side   = white;
    }
    else
    {
        field->side  = black;
    }
}



/*
 * piece_to_pattern_distance (side, piece, pside, pattern)
 *
 * Determine the minimum number of moves from the current position to a
 * specific pattern for a specific piece.  Consider the "side" piece of the
 * pattern.  The pattern should match for "pside".
 */

short
piece_to_pattern_distance(short side, short piece,
                          short pside, short pattern)
{
    short nP, P[4], nB, B[4]; /* at most 4 pieces of same kind */
    short i, j, r, dd, occupied, mindd, c[4], d[4];
    /* a "side" patternfield must match a "c1" piece on board: */
    short c1 = side ^ pside;

    /*
     * If pside == white, a black piece in the pattern should match a white
     * piece on board, and vice versa. Furthermore, if pside == white,
     * reversed pattern should match board.
     */

    /* special pawn handling */

    if (piece == pawn)
    {
        mindd = occupied = 0;

        for (i = Pattern[pattern].first_field;
             pattern_data[i] != END_OF_FIELDS;
             i += 2)
        {
            struct PatternField field;
            set_field(i, &field);

            if ((field.side == side) && (field.piece == pawn))
            {
                short t = field.square;
                short pcol = column(t);
                dd = CANNOT_REACH;

                if (PawnCnt[c1][(side == c1) ? pcol : (8 - pcol)])
                {
                    /* there is a pawn on the column */
                    for (j = 0; j <= PieceCnt[c1]; j++)
                    {
                        short sq = (short)PieceList[c1][j];

                        if (board[sq] == pawn)
                        {
                            if (pside == white)
                                sq = NO_SQUARES - 1 - sq;

                            if (column(sq) == pcol)
                            {
                                dd = piece_distance (side, pawn, sq, t);
#ifdef TEST_PATTERN
                                printf("update %d pawn "
                                       "from %d to %d is %d\n",
                                       side, sq, t, dd);
#endif
                                break;
                            }
                        }
                    }
                }
                else
                {
                    /* there is no pawn on the column; drop possible? */
                    if (Captured[c1][pawn])
                    {
                        dd = 1;
#ifdef TEST_PATTERN
                        printf("update %d pawn drop to %d is %d\n",
                               side, t, dd);
#endif
                    }
                }

                if (dd >= 0)
                {
                    /* Increment distance if pattern field is occupied */
                    short psq, pc;

                    if (pside == black)
                    {
                        psq = t;
                        pc = field.side;
                    }
                    else
                    {
                        psq = (NO_SQUARES - 1 - t);
                        pc = ~field.side;
                    }

                    if ((color[psq] == pc) && (board[psq] != pawn))
                    {
#ifdef TEST_PATTERN
                        printf("square %d is occupied\n", psq);
#endif
                        ++occupied;
                    }

                    mindd += dd;
                }
                else
                {
                    return CANNOT_REACH;
                }
            }
        }

        return mindd + occupied;
    }

    /*
     * Determine list of "side" "piece"s in pattern.
     */

    for (occupied = nP = 0, i = Pattern[pattern].first_field;
         pattern_data[i] != END_OF_FIELDS;
         i += 2)
    {
        struct PatternField field;
        set_field(i, &field);

        if ((field.side == side) && (field.piece == piece))
        {
            short psq, pc;
            P[nP] = field.square;
#ifdef TEST_PATTERN
            printf("pattern %d piece %d on square %d\n", side, piece, P[nP]);
#endif
            nP++;

            /* Increment distance if pattern field is occupied */
            if (pside == black)
            {
                psq = field.square;
                pc = field.side;
            }
            else
            {
                psq = NO_SQUARES - 1 - field.square;
                pc  = field.side ^ 1;
            }

            if ((color[psq] == pc) && (board[psq] != field.piece))
            {
#ifdef TEST_PATTERN
                printf("square %d is occupied\n", psq);
#endif
                ++occupied;
            }
        }
    }

    if (nP == 0)
        return 0;

#ifdef TEST_PATTERN
    printf("finding in pattern %d pieces %d of side %d\n", nP, piece, side);
#endif

    /*
     * Determine list of "side ^ pside" "piece"s captured or on board.
     */

    for (nB = 0; nB < Captured[c1][piece]; nB++)
        B[nB] = NO_SQUARES + piece;

    for (i = 0; i <= PieceCnt[c1]; i++)
    {
        short sq = PieceList[c1][i];

        if (board[sq] == piece)
        {
            B[nB] = (pside == black) ? sq : (NO_SQUARES - 1 - sq);
#ifdef TEST_PATTERN
            printf("%d piece %d on square %d\n", side, piece, B[nB]);
#endif
            nB++;
        }
    }

#ifdef TEST_PATTERN
    printf("found on board %d pieces %d of side %d\n", nB, piece, side);
#endif

    if (nP > nB)
    {
        return CANNOT_REACH;
    }

    /* Determine best assignment from board piece to pattern piece */

    r = 0;
    c[0] = -1;
    mindd = CANNOT_REACH;

    while ((r >= 0) && (mindd != 0))
    {

        if (++c[r] == nB)
        {
            r--;
        }
        else
        {
            for (i = 0; i < r; i++)
            {
                if (c[i] == c[r])
                    break;
            }

            if (i == r)
            {
                d[r] =  piece_distance (side, piece, B[c[r]], P[r]);
#ifdef TEST_PATTERN
                printf("update d[%d] from  %d to %d is %d\n",
                       r, B[c[r]], P[r], d[r]);
#endif
                if (d[r] < 0)
                {
                    /* r--; */
                }
                else
                {
                    if (++r == nP)
                    {
                        for (dd = i = 0; i < nP; i++)
                            dd += d[i];

                        if ((dd < mindd) || (mindd < 0))
                        {
                            mindd = dd;
#ifdef TEST_PATTERN
                            printf("update min %d\n", mindd);
#endif
                        }

                        r--;
                    }
                    else
                    {
                        c[r] = -1;
                    }
                }
            }
        }
    }

    if (mindd < 0)
        return CANNOT_REACH;
    else
        return (mindd + occupied);

}



/*
 * pattern_distance (pside, pattern)
 *
 * Determine the minimum number of moves for the pieces from
 * the current position to reach a pattern.
 * The result is CANNOT_REACH, if there is no possible sequence
 * of moves.
 *
 */

short
pattern_distance (short pside, short pattern)
{
    short side, piece, d, n;

#ifdef TEST_PATTERN
    printf("\nchecking pattern %d for pside=%d\n\n", pattern, pside);
#endif

    for (n = side = 0; side <= 1 && n >= 0; side++)
    {
        for (piece = pawn; piece <= king; piece++)
        {
            d = piece_to_pattern_distance (side, piece, pside, pattern);

            if (d < 0)
            {
                n = CANNOT_REACH;
                break;
            }
            else
            {
                n += d;
            }
        }
    }

#ifdef TEST_PATTERN
    printf("\ndistance to pattern is %d\n\n", n);
#endif

    return n;
}



/*
 * board_to_pattern_distance(pside, osequence, pmplty, GameCnt)
 *
 * Determine the maximal difference of the number of moves from the pattern
 * to the initial position and to the current position.
 * Differences are weighted, i.e. the more closer a position is to a pattern
 * the more valuable is a move towards the pattern.
 * Patterns, which are at least "pmplty" halfmoves away, are not counted.
 */

short
board_to_pattern_distance
(short pside, short osequence, short pmplty, short GameCnt)
{
    short i, d, dist, diff, weighted_diff;
    short maxdiff = 0, max_weighted_diff = 0;
    short pattern;

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        for (pattern = OpeningSequence[osequence].first_pattern[i];
             pattern != END_OF_PATTERNS;
             pattern = Pattern[pattern].next_pattern)
        {
            if ((d = Pattern[pattern].distance[pside]) >= 0)
            {
                if (pmplty > d)
                {
                    dist = pattern_distance (pside, pattern);
                    if (dist >= 0)
                    {
                        /*
                         * "dist" is the distance of the current board
                         * position to the pattern.  "d - dist" is the
                         * difference between the current distance and the
                         * initial distance. Compute "diff" as the weighted
                         * difference.
                         */

                        /* try to reach the nearest pattern */
                        weighted_diff = (diff = (d - dist)) * (pmplty - d);

                        if (weighted_diff > max_weighted_diff)
                        {
#ifdef COUNT_DIFF
                            maxdiff = diff;
#else
                            maxdiff = weighted_diff;
#endif
                            max_weighted_diff = weighted_diff;
                        }

                        /*
                         * A reached pattern should not be considered in
                         * the future (if GameCnt >= 0)
                         */

                        if (dist == 0 && GameCnt >= 0)
                            Pattern[pattern].reachedGameCnt[pside] = GameCnt;
                    }
                }
            }
        }
    }

    return maxdiff;
}




void
DisplayPattern (FILE *fd, short n)
{
    small_short pboard[NO_SQUARES], pcolor[NO_SQUARES];
    short sq, i,  r, c;

    for (sq = 0; sq < NO_SQUARES; sq++)
    {
        pboard[sq] = no_piece;
        pcolor[sq] = neutral;
    }

    for (i = n; pattern_data[i] != END_OF_FIELDS; i += 2)
    {
        struct PatternField field;
        set_field(i, &field);
        pboard[field.square] = field.piece;
        pcolor[field.square] = field.side;
    }

    for (r = NO_ROWS - 1; r >= 0; r--)
    {
        for (c = 0; c < NO_COLS; c++)
        {
            sq = r*NO_COLS + c;
            i = pboard[sq];

            if (i == no_piece)
                fprintf(fd, " -");
            else
                fprintf(fd, "%c%c", is_promoted[i] ? '+' : ' ',
                        pcolor[sq] ? pxx[i] : qxx[i]);
        }

        fprintf(fd, "\n");
    }

    fprintf(fd, "\n");
}




static void
VisitReachable (int pside, short osequence, int k, int n, int remove)
{
    short i, j;
    short pattern;

    /* Adjust to sequence pattern n */
    for (i = 0, pattern = OpeningSequence[osequence].first_pattern[k];
         i < n; i++)
    {
        pattern = Pattern[pattern].next_pattern;
    }

    /* do not perform visited link twice */
    if (Pattern[pattern].visited)
    {
        return;
    }
    else
    {
        Pattern[pattern].visited = true;
    }

    /* Declare links unreachable */
    for (j = Pattern[pattern].first_link;
         pattern_data[j] != END_OF_LINKS; j++)
    {
        VisitReachable(pside, osequence, k, pattern_data[j], remove);
    }

    /* Declare unreachable */
    if (remove && Pattern[pattern].distance[pside] >= 0)
    {
        Pattern[pattern].distance[pside] = IS_SUCCESSOR;
    }
}


/* simplified matching for opening type names */

#define match_char(a, b) \
(a == b || (a == '*' && b != 'U') || (b == '*' && a != 'U'))

#define match_name(a, b, l) \
(l > 8 && match_char(a[0], b[0]) && match_char(a[7], b[7]) \
&& match_char(a[9], b[9]))


short
locate_opening_sequence(short pside, char *s, short GameCnt)
{
    short i, j, k, os, d;
    short l = strlen(s);
    short check_visited[MAX_SEQUENCE];
    char name[MAX_NAME], name2[MAX_NAME];

    /*
     * Look for opening pattern name in the list of opening patterns.
     */

    name[0] = '\0';

    for (i = 1, os = 0; os < MAX_OPENING_SEQUENCE; os++)
    {
        /* locate matching opening type name */
        NameOfOpeningValue(OpeningSequence[os].opening_type, name);

        if (match_name(s, name, l))
        {
            /* locate successor matching names */
            for (k = os + 1; k < MAX_OPENING_SEQUENCE; k++)
            {
                NameOfOpeningValue(OpeningSequence[k].opening_type, name2);

                if (match_name(s, name2, l))
                {
                    OpeningSequence[os].first_pattern[i++]
                        = OpeningSequence[k].first_pattern[0];
                }
            }

            break;
        }
    }

    if (os >= MAX_OPENING_SEQUENCE)
    {
        return END_OF_SEQUENCES;
    }
    else
    {
        for (; i < MAX_SEQUENCE;
             OpeningSequence[os].first_pattern[i++] = END_OF_PATTERNS);
    }

    /*
     * Determine patterns which can be reached from the current
     * board position. Only patterns which can be reached will be
     * checked in the following search.
     */

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        check_visited[i] = false;

        for (k = OpeningSequence[os].first_pattern[i];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            Pattern[k].visited = false;
        }
    }

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        for (k = OpeningSequence[os].first_pattern[i];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            Pattern[k].distance[pside] = pattern_distance(pside, k);

            /* Actually reached patterns need not to be observed. */
            if (Pattern[k].distance[pside] == 0)
            {
                Pattern[k].distance[pside] = CANNOT_REACH;
                check_visited[i] = Pattern[k].visited = true;

                for (j = Pattern[k].first_link;
                     pattern_data[j] != END_OF_LINKS; j++)
                {
                    VisitReachable(pside, os, i, pattern_data[j], false);
                }
            }
            else if ((GameCnt >= 0)
                     && (GameCnt >= Pattern[k].reachedGameCnt[pside]))
            {
                Pattern[k].distance[pside] = IS_REACHED;
            }

            if (Pattern[k].reachedGameCnt[pside] >= GameCnt)
                Pattern[k].reachedGameCnt[pside] = MAXMOVES;
        }
    }

    /*
     * Remove reachable patterns from search, which are successors of
     * reachable patterns. So, only the next pattern of a pattern sequence
     * is observed.
     */

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        for (k = OpeningSequence[os].first_pattern[i];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            if (check_visited[i] && !Pattern[k].visited)
                Pattern[k].distance[pside] = NOT_TO_REACH;
            else
                Pattern[k].visited = false;
        }
    }

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        for (k = OpeningSequence[os].first_pattern[i];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            if ((d = Pattern[k].distance[pside]) >= 0)
            {
                for (j = Pattern[k].first_link;
                     pattern_data[j] != END_OF_LINKS; j++)
                {
                    VisitReachable(pside, os, i, pattern_data[j], true);
                }
            }
        }
    }

    /*
     * Look to see whether there is still a reachable pattern.
     */

    for (i = 0; i < MAX_SEQUENCE; i++)
    {
        for (k = OpeningSequence[os].first_pattern[i];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            if ((d = Pattern[k].distance[pside]) >= 0)
                return os;
        }
    }

    return END_OF_SEQUENCES;
}




void
update_advance_bonus (short pside, short os)
{
    struct PatternField field;
    short i, j, k, d;

    for (j = 0; j < MAX_SEQUENCE; j++)
    {
        for (k = OpeningSequence[os].first_pattern[j];
             k != END_OF_PATTERNS;
             k = Pattern[k].next_pattern)
        {
            if ((d = Pattern[k].distance[pside]) >= 0)
            {
                for (i = Pattern[k].first_field;
                     pattern_data[i] != END_OF_FIELDS; i += 2)
                {
                    set_field(i, &field);
                    if (field.side == black)
                    {
                        short square = (pside == black)
                            ? field.square
                            : NO_SQUARES - 1 - field.square;

                        (*Mpiece[field.piece])[pside][square]
                            += ADVNCM[field.piece];
                    }
                }
            }
        }
    }
}

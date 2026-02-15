"use client";

import {useState} from "react";
import {MitgliederTreeviewType} from "@/types/miglieder-treeview-type";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {ChevronDown, ChevronRight, User} from "lucide-react";

interface TreeNode {
    letter: string;
    members: MitgliederTreeviewType[];
}

interface TreeviewProps {
    lstMitglieder: MitgliederTreeviewType[];
    onMemberSelect?: (id: number) => void;
}

export default function Treeview({lstMitglieder, onMemberSelect}: TreeviewProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Gruppiere Mitglieder nach dem ersten Buchstaben des Nachnamens
    const treeData: TreeNode[] = lstMitglieder.reduce((acc, member) => {
        const firstLetter = member.Nachname.charAt(0).toUpperCase();
        const existingNode = acc.find(node => node.letter === firstLetter);

        if (existingNode) {
            existingNode.members.push(member);
        } else {
            acc.push({
                letter: firstLetter,
                members: [member]
            });
        }

        return acc;
    }, [] as TreeNode[])
        .sort((a, b) => a.letter.localeCompare(b.letter));

    const toggleNode = (letter: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(letter)) {
            newExpanded.delete(letter);
        } else {
            newExpanded.add(letter);
        }
        setExpandedNodes(newExpanded);
    };

    const handleMemberClick = (id: number) => {
        if (onMemberSelect) {
            onMemberSelect(id);
        }
        //console.log('Ausgewählte Mitglieder-ID:', id);
    };

    return (
        <Card className="w-full gap-0">
            <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold">Mitglieder-Liste</h2>
            </CardHeader>
            <CardContent className="pt-2 p-4">
                <div className="space-y-1">
                    {treeData.map((node) => (
                        <div key={node.letter} className="space-y-1">
                            {/* Knoten Header */}
                            <div
                                className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                                onClick={() => toggleNode(node.letter)}
                            >
                                {expandedNodes.has(node.letter) ? (
                                    <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0"/>
                                ) : (
                                    <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0"/>
                                )}
                                <span
                                    className="font-medium">{node.letter} ({node.members.length})</span>
                            </div>

                            {/* Kinder Elemente */}
                            {expandedNodes.has(node.letter) && (
                                <div className="ml-6 space-y-1">
                                    {node.members.map((member) => (
                                        <div
                                            key={member.ID}
                                            className="flex items-center cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors min-w-0"
                                            onClick={() => handleMemberClick(member.ID)}
                                        >
                                            <User className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"/>
                                            <span className="text-sm truncate"
                                                  title={`${member.Nachname}, ${member.Vorname}`}>
                        {member.Nachname}, {member.Vorname}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
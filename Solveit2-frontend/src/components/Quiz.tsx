import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomIcons from '@/assets/icons/CustomIcons';
import images from '@/constants/images';

interface QuizOption {
  text: string;
}

interface QuizData {
  id: string;
  createdAt: string;
  title: string;
  options: QuizOption[];
  voteCount: Record<number, number>;
  userVoted: number | null;
  totalVotes: number;
}

interface QuizProps {
  quiz: QuizData;
  isLogged: boolean;
}

const Quiz: React.FC<QuizProps> = ({ quiz, isLogged }) => {
  const [selectedOptionLocal, setSelectedOptionLocal] = useState<number | null>(quiz.userVoted);
  const [userVotedLocal, setUserVotedLocal] = useState<boolean>(quiz.userVoted !== null);
  const [totalVotesLocal, setTotalVotesLocal] = useState<number>(quiz.totalVotes);
  const [votesCountLocal, setVotesCountLocal] = useState<Record<number, number>>({ ...quiz.voteCount });
  const [isLoadingVote, setIsLoadingVote] = useState<boolean>(false);

  const handleVote = (optionIndex: number) => {
    if (isLoadingVote) return;
    setIsLoadingVote(true);

    setVotesCountLocal(prev => {
      const updated = { ...prev };

      if (userVotedLocal && selectedOptionLocal === optionIndex) {
        updated[optionIndex] = Math.max((updated[optionIndex] || 1) - 1, 0);
        setSelectedOptionLocal(null);
        setUserVotedLocal(false);
        setTotalVotesLocal(prevTotal => Math.max(prevTotal - 1, 0));
      } else if (userVotedLocal && selectedOptionLocal !== null) {
        updated[selectedOptionLocal] = Math.max((updated[selectedOptionLocal] || 1) - 1, 0);
        updated[optionIndex] = (updated[optionIndex] || 0) + 1;
        setSelectedOptionLocal(optionIndex);
      } else {
        updated[optionIndex] = (updated[optionIndex] || 0) + 1;
        setSelectedOptionLocal(optionIndex);
        setUserVotedLocal(true);
        setTotalVotesLocal(prevTotal => prevTotal + 1);
      }

      return updated;
    });

    setIsLoadingVote(false);
  };

  if (!isLogged || !quiz) return null;

  const formattedDate = format(new Date(quiz.createdAt), 'dd MMM yyyy', { locale: ptBR });

  return (
    <View className="flex-1 bg-backgroundStandardLight rounded-2xl border border-borderStandardLight overflow-hidden">
      {/* Header Section */}
      <View className="flex-row items-center gap-2 p-3 border-b border-borderStandardLight">
        <Image source={images.iconVerified} style={{ width: 40, height: 40 }} />
        <View>
          <Text className="text-sm font-semibold text-textStandardDark">SolveIt</Text>
          <Text className="text-xs text-textSecondary">Pergunta do Sistema</Text>
        </View>
      </View>

      {/* Question Section */}
      <View className="p-3">
        <Text className="text-base font-semibold text-textStandardDark mb-3">{quiz.title}</Text>

        <View className="border border-borderStandardLight p-3 rounded-xl gap-2">
          {/* Voting Options */}
          {quiz.options.map((option, index) => {
            const votesForOption = votesCountLocal[index] || 0;
            const percentage = totalVotesLocal > 0 ? (votesForOption / totalVotesLocal) * 100 : 0;
            const isSelected = selectedOptionLocal === index;

            return (
              <Pressable
                key={index}
                className={`flex-row items-center justify-between py-3 px-3 rounded-md  ${isSelected ? 'bg-[#E0E7FF] border-[#C7D2FE]' : 'bg-[#F1F5F9]'}`}
                onPress={() => handleVote(index)}
                disabled={isLoadingVote}
              >
                <View className="flex-row items-center flex-1">
                  <Text className="font-semibold text-textStandardDark mr-2">{percentage.toFixed(0)}%</Text>
                  <Text className="text-sm flex-1" numberOfLines={2}>
                    {option.text}
                  </Text>
                  {isSelected && <CustomIcons name="correct" size={18} color="#01B297" />}
                </View>
                <Text className="text-sm font-semibold text-textSecondary ml-1">{votesForOption}</Text>
              </Pressable>
            );
          })}

          {/* Footer Section */}
          <Text className="text-xs text-textSecondary text-center mt-3">
            {formattedDate} — {totalVotesLocal} votos no total
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Quiz;

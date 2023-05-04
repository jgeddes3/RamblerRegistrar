// styleComponents/BackgroundImage.js
import styled from 'styled-components/native';
import { ImageBackground } from 'react-native';

const BackgroundImage = styled(ImageBackground)`
  flex: 1;
  width: null;
  height: null;
  resizeMode: cover;
`;

export default BackgroundImage;

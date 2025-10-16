const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const glob = require('glob');

const isProduction = process.env.NODE_ENV === 'production';

// 🔍 SCSS 엔트리 자동 수집
const scssEntries = {};
glob.sync('./src/assets/scss/*.scss').forEach((file) => {
  const name = path.basename(file, '.scss');
  // scssEntries[name] = file;
  scssEntries[name] = `./${file.replace(/^\.\//, '')}`;
});

const htmlPages = glob.sync('./src/pages/**/*.html');

module.exports = {
  entry: {
		// main: './src/main.js',
		...scssEntries,
	},  // 실제 JS 엔트리 파일
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/js/[name].js',
		publicPath: '/',
    clean: true,
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          'html-loader',      // ejs 처리 후 HTML 소스를 가져오기 위해 필요
          'ejs-plain-loader', // EJS를 순수 HTML로 변환
        ]
      },
      {
        test: /\.scss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          // MiniCssExtractPlugin.loader,  // CSS 파일로 분리
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]', // 이미지/폰트는 이름 유지하며 복사
        },
      },
    ],
  },
  plugins: [
    // new MiniCssExtractPlugin({
    //   filename: 'assets/css/[name].css',
    // }),
    isProduction && new MiniCssExtractPlugin({
      filename: 'assets/css/[name].css',
    }),
    // HTML로 생성
    ...htmlPages.map((file) => {
      const name = path.basename(file, '.html');
      return new HtmlWebpackPlugin({
        template: file,
        filename: `html/${name}.html`, // dist/pages/ 폴더 내에 출력
        inject: false, // JS 자동 주입 안함
        minify: false,
      });
    }),
    // img, fonts, js 폴더 그대로 복사 (src/assets -> dist/assets)
    new CopyWebpackPlugin({
      patterns: [
				{ from: 'src/assets/js', to: 'assets/js', noErrorOnMissing: true },
        { from: 'src/assets/images', to: 'assets/images', noErrorOnMissing: true },
        { from: 'src/assets/fonts', to: 'assets/fonts',  noErrorOnMissing: true },
      ],
    }),
  ],
	optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        extractComments: false, // 라이선스 파일 추출 비활성화
      }),
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.json', '.scss', '.pug'],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
		// devMiddleware: {
		// 	publicPath: '/',
		// },
    port: 4000,
    open: ['/html/index.html'],
    // liveReload: true,
    hot: true,
		watchFiles: ['src/**/*'],
    // watchFiles: ['src/**/*.html', 'src/**/*.ejs'],
  },
  // mode: 'development', // 배포시 'production'으로 변경
  mode: isProduction ? 'production' : 'development',
};

